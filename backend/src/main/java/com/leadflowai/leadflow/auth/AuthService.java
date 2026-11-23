package com.leadflowai.leadflow.auth;

import com.leadflowai.leadflow.common.ApiException;
import com.leadflowai.leadflow.security.CurrentUser;
import com.leadflowai.leadflow.security.JwtService;
import com.leadflowai.leadflow.user.User;
import com.leadflowai.leadflow.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentUser currentUser;

    @Value("${app.cookie.name}")
    private String cookieName;

    @Value("${app.cookie.secure}")
    private boolean cookieSecure;

    @Value("${app.jwt-expiration-minutes}")
    private long expirationMinutes;

    public UserDto login(LoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS",
                        "Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email or password");
        }
        String token = jwtService.generateToken(user.getEmail(), user.getRole());
        ResponseCookie cookie = ResponseCookie.from(cookieName, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/")
                .maxAge(Duration.ofMinutes(expirationMinutes))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return toDto(user);
    }

    public void logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public UserDto me() {
        return toDto(currentUser.get());
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId().toString(), user.getEmail(), user.getFullName(), user.getRole());
    }
}
