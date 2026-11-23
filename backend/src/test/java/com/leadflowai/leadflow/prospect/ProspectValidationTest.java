package com.leadflowai.leadflow.prospect;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProspectValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejectsBlankCompanyAndDescription() {
        ProspectCreateRequest request = new ProspectCreateRequest(
                "  ", null, null, null, null, "  ", ProspectSource.MANUAL);
        assertFalse(validator.validate(request).isEmpty());
    }

    @Test
    void rejectsInvalidEmail() {
        ProspectCreateRequest request = new ProspectCreateRequest(
                "Acme", null, "not-an-email", null, null, "Description", ProspectSource.FORM);
        assertTrue(validator.validate(request).stream()
                .anyMatch(violation -> violation.getPropertyPath().toString().equals("email")));
    }

    @Test
    void acceptsValidRequest() {
        ProspectCreateRequest request = new ProspectCreateRequest(
                "Acme", "Jane Doe", "jane@example.com", "https://example.com",
                "Biotech", "Description", ProspectSource.MANUAL);
        assertTrue(validator.validate(request).isEmpty());
    }
}
