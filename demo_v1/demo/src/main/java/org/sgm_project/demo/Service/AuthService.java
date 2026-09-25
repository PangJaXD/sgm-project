package org.sgm_project.demo.Service;

import org.sgm_project.demo.DTO.LoginRequest;
import org.sgm_project.demo.DTO.LoginResponse;
import org.sgm_project.demo.Model.*;
import org.sgm_project.demo.Repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    // just use autowired bro
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // if you use autowired don't add a constructor
    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // use when we got some request from login
    // it's gonna send you the response for authentication to the dashboard
    public LoginResponse login(LoginRequest request) {

        Users user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Username or password is incorrect"));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {
            throw new RuntimeException("Username or password is incorrect");
        }

        // Rule: If user is suspended or layoff, they cannot login
        boolean isSuspendedOrLayoff = false;
        if (user.getQuit_date() != null) {
            isSuspendedOrLayoff = true;
        }
        if (user.getStatus() != null) {
            String s = user.getStatus().trim().toLowerCase();
            if (s.contains("พักงาน") || s.contains("พ้นสภาพ") || s.contains("suspend") || s.contains("layoff")
                    || s.contains("fired") || s.equals("inactive")) {
                isSuspendedOrLayoff = true;
            }
        }
        if (isSuspendedOrLayoff) {
            throw new RuntimeException("login denied (suspend/layoff) user");
        }

        // this is my favorite part
        // we check this for grants permission to do other things
        String role;
        String companyName = null;
        String headName = null;
        if (user instanceof Admin) {
            role = "ADMIN";
        } else if (user instanceof Company) {
            role = "COMPANY";
            companyName = ((Company) user).getCompany_name();
        } else if (user instanceof HeadGuard) {
            role = "HEAD_GUARD";
            companyName = ((HeadGuard) user).getCompany_name();
        } else if (user instanceof Guards) {
            role = "GUARD";
            companyName = ((Guards) user).getCompany_name();
            headName = ((Guards) user).getHead_name();
        } else {
            throw new RuntimeException("Unsupported user role");
        }

        String userStatus = user.getStatus() != null ? user.getStatus()
                : (user.getQuit_date() == null ? "ปฏิบัติงาน" : "พ้นสภาพ");

        // 🌟 อัปเดตการ return ตรงนี้
        // so we send out this json
        return new LoginResponse(
                user.getUsers_id(),
                user.getUsername(),
                role,
                user.getFirst_name(), // ส่งชื่อ
                user.getLast_name(), // ส่งนามสกุล
                companyName,
                headName,
                userStatus,
                user.getStart_date());
    }
}