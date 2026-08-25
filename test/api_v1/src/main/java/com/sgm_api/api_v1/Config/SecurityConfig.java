package com.sgm_api.api_v1.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // ปิด CSRF เพราะเราทำ REST API
                .cors(cors -> cors.configurationSource(corsConfigurationSource())) // ✅ เปิดใช้งาน CORS ด้วย config ด้านล่าง
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .anyRequest().authenticated()
                );
        return http.build();
    }

    // ✅ ตั้งค่ากฎของ CORS (อนุญาตใครบ้าง, เมธอดอะไรบ้าง)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // ระบุ URL ของ React (เปลี่ยนเลขพอร์ตให้ตรงกับที่คุณรันจริง)
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173", "http://127.0.0.1:5173"));

        // อนุญาตให้ส่ง Request ด้วย Method เหล่านี้
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // อนุญาตให้ส่ง Header ทุกประเภท
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // หากต้องการให้แนบ Cookie หรือ Token มาด้วย (สำคัญสำหรับระบบ Login)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // นำกฎนี้ไปใช้กับทุกๆ API Endpoint (/**)
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // ... โค้ด PasswordEncoder และ AuthenticationManager ของเดิม ...

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}