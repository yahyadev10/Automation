package com.leadflowai.leadflow.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI leadFlowApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("LeadFlow AI API")
                        .version("v1")
                        .description("API métier : prospects, qualification IA, brouillons et activité. "
                                + "Se connecter via /api/v1/auth/login (cookie HttpOnly)."))
                .addSecurityItem(new SecurityRequirement().addList("session"))
                .components(new Components().addSecuritySchemes("session",
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Cookie HttpOnly lf_session ou header Bearer")));
    }
}
