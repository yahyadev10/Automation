package com.leadflowai.leadflow.dashboard;

import com.leadflowai.leadflow.activity.ActivityEventRepository;
import com.leadflowai.leadflow.common.Mappers;
import com.leadflowai.leadflow.emaildraft.DraftStatus;
import com.leadflowai.leadflow.emaildraft.EmailDraftRepository;
import com.leadflowai.leadflow.prospect.ProspectRepository;
import com.leadflowai.leadflow.prospect.ProspectStatus;
import com.leadflowai.leadflow.qualification.QualificationAnalysisRepository;
import com.leadflowai.leadflow.qualification.QualificationCategory;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final ProspectRepository prospectRepository;
    private final QualificationAnalysisRepository analysisRepository;
    private final EmailDraftRepository draftRepository;
    private final ActivityEventRepository activityRepository;

    @Value("${app.demo-mode}")
    private boolean demoMode;

    public DashboardSummary summary() {
        Map<ProspectStatus, Long> byStatus = new EnumMap<>(ProspectStatus.class);
        for (ProspectStatus status : ProspectStatus.values()) {
            byStatus.put(status, prospectRepository.countByStatus(status));
        }
        Map<QualificationCategory, Long> byCategory = new EnumMap<>(QualificationCategory.class);
        for (QualificationCategory category : QualificationCategory.values()) {
            byCategory.put(category, analysisRepository.countByCategory(category));
        }
        return new DashboardSummary(
                prospectRepository.countActive(),
                prospectRepository.countByStatus(ProspectStatus.QUALIFIED),
                analysisRepository.count(),
                draftRepository.countByStatus(DraftStatus.PENDING_REVIEW),
                draftRepository.countByStatus(DraftStatus.SENT),
                draftRepository.countByStatus(DraftStatus.FAILED),
                byStatus,
                byCategory,
                activityRepository.findTop10ByOrderByCreatedAtDesc().stream()
                        .map(Mappers::toActivity).toList(),
                demoMode
        );
    }
}
