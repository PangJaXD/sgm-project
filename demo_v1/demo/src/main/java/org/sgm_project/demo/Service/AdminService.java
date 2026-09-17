package org.sgm_project.demo.Service;

import org.sgm_project.demo.Exception.DuplicateUsernameException;
import org.sgm_project.demo.Model.Admin;
import org.sgm_project.demo.Repository.*;
import org.sgm_project.demo.Util.UserValidationUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AdminService {

    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final HeadGuardRepository headGuardRepository;
    private final GuardRepository guardRepository;
    private final EventRepository eventRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(
            AdminRepository adminRepository,
            UserRepository userRepository,
            CompanyRepository companyRepository,
            HeadGuardRepository headGuardRepository,
            GuardRepository guardRepository,
            EventRepository eventRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.adminRepository = adminRepository;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.headGuardRepository = headGuardRepository;
        this.guardRepository = guardRepository;
        this.eventRepository = eventRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Admin createAdmin(Admin admin) {
        // Validate Username & Password
        UserValidationUtil.validateUsername(admin.getUsername());
        UserValidationUtil.validatePassword(admin.getPassword());

        if (userRepository.findByUsername(admin.getUsername()).isPresent()) {
            throw new DuplicateUsernameException("ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว");
        }

        // เข้ารหัส password ก่อนบันทึก
        String encodedPassword = passwordEncoder.encode(admin.getPassword());
        admin.setPassword(encodedPassword);

        return adminRepository.save(admin);
    }

    public Map<String, Object> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        long totalCompanies = companyRepository.count();
        long totalHeadGuards = headGuardRepository.count();
        long totalGuards = guardRepository.count();
        long totalEvents = eventRepository.count();

        stats.put("totalCompanies", totalCompanies);
        stats.put("totalHeadGuards", totalHeadGuards);
        stats.put("totalGuards", totalGuards);
        stats.put("totalEvents", totalEvents);

        return stats;
    }
}