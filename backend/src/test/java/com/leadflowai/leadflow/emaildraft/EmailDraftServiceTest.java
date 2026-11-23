package com.leadflowai.leadflow.emaildraft;

import com.leadflowai.leadflow.activity.ActivityService;
import com.leadflowai.leadflow.automation.AutomationClient;
import com.leadflowai.leadflow.automation.AutomationDispatcher;
import com.leadflowai.leadflow.automation.AutomationRunRepository;
import com.leadflowai.leadflow.common.ApiException;
import com.leadflowai.leadflow.prospect.Prospect;
import com.leadflowai.leadflow.prospect.ProspectService;
import com.leadflowai.leadflow.qualification.QualificationAnalysisRepository;
import com.leadflowai.leadflow.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailDraftServiceTest {

    @Mock private EmailDraftRepository repository;
    @Mock private QualificationAnalysisRepository analysisRepository;
    @Mock private AutomationRunRepository runRepository;
    @Mock private ProspectService prospectService;
    @Mock private AutomationClient automationClient;
    @Spy private AutomationDispatcher dispatcher = new AutomationDispatcher();
    @Mock private ActivityService activityService;
    @InjectMocks private EmailDraftService service;

    private final User owner = User.builder().id(UUID.randomUUID()).email("user@example.com").role("USER").build();
    private final Prospect prospect = Prospect.builder().id(UUID.randomUUID()).owner(owner).build();
    private final UUID draftId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "emailProvider", "console");
    }

    @Test
    void cannotSendPendingDraft() {
        when(repository.findById(draftId)).thenReturn(Optional.of(draft(DraftStatus.PENDING_REVIEW)));
        ApiException ex = assertThrows(ApiException.class, () -> service.send(draftId, owner));
        assertEquals(409, ex.getStatus().value());
        verifyNoInteractions(automationClient);
    }

    @Test
    void cannotSendRejectedDraft() {
        when(repository.findById(draftId)).thenReturn(Optional.of(draft(DraftStatus.REJECTED)));
        assertThrows(ApiException.class, () -> service.send(draftId, owner));
        verifyNoInteractions(automationClient);
    }

    @Test
    void approvedDraftTriggersSimulatedSend() {
        when(repository.findById(draftId)).thenReturn(Optional.of(draft(DraftStatus.APPROVED)));
        when(runRepository.existsByDraftIdAndAutomationTypeAndStatus(any(), any(), any())).thenReturn(false);
        when(runRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        SendResponse response = service.send(draftId, owner);
        assertTrue(response.simulated());
        assertEquals("PENDING", response.status());
        verify(automationClient).requestEmailSend(any());
    }

    @Test
    void onlyPendingDraftCanBeApproved() {
        when(repository.findById(draftId)).thenReturn(Optional.of(draft(DraftStatus.SENT)));
        assertThrows(ApiException.class, () -> service.approve(draftId, owner));
        verifyNoInteractions(automationClient);
    }

    private EmailDraft draft(DraftStatus status) {
        return EmailDraft.builder()
                .id(draftId)
                .prospect(prospect)
                .subject("Subject")
                .body("Body")
                .status(status)
                .build();
    }
}
