package com.sgm_api.api_v1.Controller;

import com.sgm_api.api_v1.DTO.LoginRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173") // ระบุ Port ของ Vite React
public class AuthController {

    private final AuthenticationManager authenticationManager;

    public AuthController(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            // ให้ Spring Security ตรวจสอบ Username และ Password
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            // ถ้าผ่าน จะลงมาทำงานตรงนี้ (ในระบบจริงควร สร้าง JWT Token แล้วส่งกลับไป)
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Login สำเร็จ!");
            response.put("username", authentication.getName());

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            // ถ้า Username หรือ Password ผิด
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Username หรือ Password ไม่ถูกต้อง");

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }
}