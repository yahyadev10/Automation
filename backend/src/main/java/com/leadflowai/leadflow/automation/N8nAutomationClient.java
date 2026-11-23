package com.leadflowai.leadflow.automation;

import com.leadflowai.leadflow.common.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Slf4j
@Component
public class N8nAutomationClient implements AutomationClient {

    private final RestClient restClient;
    private final String secret;
    private final String qualifyUrl;
    private final String draftUrl;
    private final String sendUrl;

    public N8nAutomationClient(RestClient.Builder builder,
                               @Value("${app.webhook-secret}") String secret,
                               @Value("${app.automation.qualify-url}") String qualifyUrl,
                               @Value("${app.automation.email-draft-url}") String draftUrl,
                               @Value("${app.automation.email-send-url}") String sendUrl,
                               @Value("${app.http-timeout-ms}") int timeoutMs) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(timeoutMs);
        factory.setReadTimeout(timeoutMs);
        this.restClient = builder.requestFactory(factory).build();
        this.secret = secret;
        this.qualifyUrl = qualifyUrl;
        this.draftUrl = draftUrl;
        this.sendUrl = sendUrl;
    }

    @Override
    public void requestQualification(QualificationPayload payload) {
        post(qualifyUrl, payload, "QUALIFICATION", payload.correlationId());
    }

    @Override
    public void requestEmailDraft(EmailDraftPayload payload) {
        post(draftUrl, payload, "EMAIL_DRAFT", payload.correlationId());
    }

    @Override
    public void requestEmailSend(EmailSendPayload payload) {
        post(sendUrl, payload, "EMAIL_SEND", payload.correlationId());
    }

    private void post(String url, Object payload, String type, java.util.UUID correlationId) {
        try {
            restClient.post()
                    .uri(url)
                    .header("X-LeadFlow-Secret", secret)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            log.warn("Automation request failed type={} correlationId={} error={}",
                    type, correlationId, ex.getClass().getSimpleName());
            throw ApiException.automationUnavailable("Automation request failed for " + type);
        }
    }
}
