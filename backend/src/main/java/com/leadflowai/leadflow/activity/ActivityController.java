package com.leadflowai.leadflow.activity;

import com.leadflowai.leadflow.common.Mappers;
import com.leadflowai.leadflow.common.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/activity")
@RequiredArgsConstructor
@Tag(name = "Activity", description = "Historique des événements")
public class ActivityController {

    private final ActivityEventRepository repository;

    @GetMapping
    @Operation(summary = "Événements paginés, du plus récent au plus ancien")
    public PageResponse<ActivityResponse> list(
            @PageableDefault(size = 30, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return PageResponse.from(repository.findAllByOrderByCreatedAtDesc(pageable).map(Mappers::toActivity));
    }
}
