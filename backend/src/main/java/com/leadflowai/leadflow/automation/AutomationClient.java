package com.leadflowai.leadflow.automation;

public interface AutomationClient {
    void requestQualification(QualificationPayload payload);

    void requestEmailDraft(EmailDraftPayload payload);

    void requestEmailSend(EmailSendPayload payload);
}
