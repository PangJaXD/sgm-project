package org.sgm_project.demo.Controller;

import org.sgm_project.demo.DTO.LoginRequest;
import org.sgm_project.demo.DTO.LoginResponse;
import org.sgm_project.demo.Service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class AuthController {

    //แนะนำให้ autowired(no controller for this)
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // response for login useful for bringing data through user
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request
    ) {

        return ResponseEntity.ok(
                authService.login(request)
        );
    }
}