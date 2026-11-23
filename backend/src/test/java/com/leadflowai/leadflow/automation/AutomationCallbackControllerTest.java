package com.leadflowai.leadflow.automation;

import com.leadflowai.leadflow.common.GlobalExceptionHandler;
import com.leadflowai.leadflow.emaildraft.EmailDraftService;
import com.leadflowai.leadflow.qualification.QualificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AutomationCallbackControllerTest {

    @Mock private QualificationService qualificationService;
    @Mock private EmailDraftService draftService;

    private MockMvc mockMvc;

    private static final String BODY = """
            {
              "correlationId": "11111111-1111-1111-1111-111111111111",
              "prospectId": "22222222-2222-2222-2222-222222222222",
              "status": "SUCCESS",
              "score": 82,
              "category": "HIGH",
              "summary": "Fit based only on supplied information",
              "confidence": "MEDIUM",
              "modelName": "mock-model",
              "promptVersion": "v1"
            }
            """;

    @BeforeEach
    void setUp() {
        WebhookSecretValidator validator = new WebhookSecretValidator("test-secret-0123456789");
        AutomationCallbackController controller =
                new AutomationCallbackController(validator, qualificationService, draftService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void rejectsCallbackWithoutSecret() throws Exception {
        mockMvc.perform(post("/api/v1/automation/callbacks/qualification")
                        .contentType(APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(qualificationService);
    }

    @Test
    void rejectsCallbackWithWrongSecret() throws Exception {
        mockMvc.perform(post("/api/v1/automation/callbacks/qualification")
                        .header("X-LeadFlow-Secret", "wrong-secret")
                        .contentType(APPLICATION_JSON).content(BODY))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(qualificationService);
    }

    @Test
    void acceptsCallbackWithValidSecret() throws Exception {
        mockMvc.perform(post("/api/v1/automation/callbacks/qualification")
                        .header("X-LeadFlow-Secret", "test-secret-0123456789")
                        .contentType(APPLICATION_JSON).content(BODY))
                .andExpect(status().isOk());
        verify(qualificationService).handleCallback(any());
    }
}
