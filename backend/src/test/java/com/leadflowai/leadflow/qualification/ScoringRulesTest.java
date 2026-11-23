package com.leadflowai.leadflow.qualification;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ScoringRulesTest {

    @Test
    void categoriesFollowSpecifiedBoundaries() {
        assertEquals(QualificationCategory.HIGH, ScoringRules.categoryFor(70));
        assertEquals(QualificationCategory.HIGH, ScoringRules.categoryFor(100));
        assertEquals(QualificationCategory.MEDIUM, ScoringRules.categoryFor(69));
        assertEquals(QualificationCategory.MEDIUM, ScoringRules.categoryFor(40));
        assertEquals(QualificationCategory.LOW, ScoringRules.categoryFor(39));
        assertEquals(QualificationCategory.LOW, ScoringRules.categoryFor(0));
    }

    @Test
    void scoreIsAlwaysClampedBetweenZeroAndHundred() {
        assertEquals(0, ScoringRules.clampScore(null));
        assertEquals(0, ScoringRules.clampScore(-12));
        assertEquals(100, ScoringRules.clampScore(184));
        assertEquals(82, ScoringRules.clampScore(82));
    }

    @Test
    void invalidConfidenceFallsBackToLow() {
        assertEquals(ConfidenceLevel.MEDIUM, ScoringRules.parseConfidence("medium"));
        assertEquals(ConfidenceLevel.LOW, ScoringRules.parseConfidence("unknown"));
        assertEquals(ConfidenceLevel.LOW, ScoringRules.parseConfidence(null));
    }
}
