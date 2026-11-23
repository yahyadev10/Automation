package com.leadflowai.leadflow.qualification;

import org.springframework.stereotype.Component;

@Component
public class ScoringRules {

    public static QualificationCategory categoryFor(int score) {
        if (score >= 70) return QualificationCategory.HIGH;
        if (score >= 40) return QualificationCategory.MEDIUM;
        return QualificationCategory.LOW;
    }

    public static int clampScore(Integer score) {
        if (score == null) return 0;
        return Math.max(0, Math.min(100, score));
    }

    public static ConfidenceLevel parseConfidence(String value) {
        if (value == null || value.isBlank()) return ConfidenceLevel.LOW;
        try {
            return ConfidenceLevel.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return ConfidenceLevel.LOW;
        }
    }
}
