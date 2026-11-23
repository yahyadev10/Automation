package com.leadflowai.leadflow.dashboard;

import com.leadflowai.leadflow.activity.ActivityResponse;
import com.leadflowai.leadflow.prospect.ProspectStatus;
import com.leadflowai.leadflow.qualification.QualificationCategory;

import java.util.List;
import java.util.Map;

public record DashboardSummary(
        long totalProspects,
        long qualifiedProspects,
        long analysesCount,
        long pendingDrafts,
        long sentDrafts,
        long failedDrafts,
        Map<ProspectStatus, Long> prospectsByStatus,
        Map<QualificationCategory, Long> analysesByCategory,
        List<ActivityResponse> recentActivity,
        boolean demoMode
) {
}
