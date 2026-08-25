package org.sgm_project.demo.Service;

import org.sgm_project.demo.DTO.LoginRequest;
import org.sgm_project.demo.DTO.LoginResponse;
import org.sgm_project.demo.Model.Admin;
import org.sgm_project.demo.Model.Company;
import org.sgm_project.demo.Model.HeadGuard;
import org.sgm_project.demo.Model.Users;
import org.sgm_project.demo.Repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse login(LoginRequest request) {

        Users user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() ->
                        new RuntimeException("Username or password is incorrect")
                );

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        )) {
            throw new RuntimeException("Username or password is incorrect");
        }

        String role;

        if (user instanceof Admin) {
            role = "ADMIN";
        }
        else if (user instanceof Company) {
            role = "COMPANY";
        }
        else if (user instanceof HeadGuard) {
            role = "HEAD_GUARD";
        }
        else {
            throw new RuntimeException("Unsupported user role");
        }

        // 🌟 อัปเดตการ return ตรงนี้
        return new LoginResponse(
                user.getUsers_id(),
                user.getUsername(),
                role,
                user.getFirst_name(), // ส่งชื่อ
                user.getLast_name()   // ส่งนามสกุล
        );
    }
}