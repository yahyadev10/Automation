package com.leadflowai.leadflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Objects;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("dev")
@Testcontainers
class BackendIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("leadflow_test")
            .withUsername("leadflow_test")
            .withPassword("leadflow_test");

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("app.jwt-secret", () -> "integration-test-jwt-secret-12345678901234567890");
        registry.add("app.webhook-secret", () -> "integration-webhook-secret-123456");
        registry.add("app.demo-mode", () -> "false");
        registry.add("app.cookie.secure", () -> "false");
    }

    @Autowired private TestRestTemplate restTemplate;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void loginCreateAndReadProspectWithRealDatabase() throws Exception {
        ResponseEntity<String> login = restTemplate.postForEntity("/api/v1/auth/login",
                json("""
                        {"email":"demo@leadflow.ai","password":"DemoPass123!"}
                        """), String.class);
        assertEquals(HttpStatus.OK, login.getStatusCode());
        String cookie = Objects.requireNonNull(login.getHeaders().getFirst(HttpHeaders.SET_COOKIE))
                .split(";")[0];

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add(HttpHeaders.COOKIE, cookie);
        ResponseEntity<String> created = restTemplate.exchange("/api/v1/prospects", HttpMethod.POST,
                new HttpEntity<>("""
                        {
                          "companyName":"Integration Biotech",
                          "contactName":"Jane Doe",
                          "email":"jane@example.com",
                          "companyDescription":"Fictitious company used by the integration test",
                          "source":"MANUAL"
                        }
                        """, headers), String.class);
        assertEquals(HttpStatus.CREATED, created.getStatusCode());
        JsonNode prospect = objectMapper.readTree(created.getBody());
        String id = prospect.get("id").asText();
        assertEquals("Integration Biotech", prospect.get("companyName").asText());
        assertEquals("NEW", prospect.get("status").asText());

        ResponseEntity<String> detail = restTemplate.exchange("/api/v1/prospects/" + id,
                HttpMethod.GET, new HttpEntity<>(headers), String.class);
        assertEquals(HttpStatus.OK, detail.getStatusCode());
        assertTrue(detail.getBody().contains("Integration Biotech"));

        ResponseEntity<String> list = restTemplate.exchange("/api/v1/prospects",
                HttpMethod.GET, new HttpEntity<>(headers), String.class);
        assertEquals(HttpStatus.OK, list.getStatusCode());
        assertTrue(list.getBody().contains("Integration Biotech"));

        ResponseEntity<String> search = restTemplate.exchange("/api/v1/prospects?search=integration",
                HttpMethod.GET, new HttpEntity<>(headers), String.class);
        assertEquals(HttpStatus.OK, search.getStatusCode());
        assertTrue(search.getBody().contains("Integration Biotech"));

        ResponseEntity<String> summary = restTemplate.exchange("/api/v1/dashboard/summary",
                HttpMethod.GET, new HttpEntity<>(headers), String.class);
        assertEquals(HttpStatus.OK, summary.getStatusCode());
        assertTrue(objectMapper.readTree(summary.getBody()).get("totalProspects").asLong() >= 1);
    }

    @Test
    void unauthenticatedRequestIsRejected() {
        ResponseEntity<String> response = restTemplate.getForEntity("/api/v1/prospects", String.class);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    private HttpEntity<String> json(String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }
}
