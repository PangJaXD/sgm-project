package org.sgm_project.demo.Service;

import org.sgm_project.demo.Model.Admin;
import org.sgm_project.demo.Repository.AdminRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AdminService {

    private final AdminRepository adminRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AdminService(AdminRepository adminRepository) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    public Admin createAdmin(Admin admin) {

        // เข้ารหัส password ก่อนบันทึก
        //this is for your own safety
        String encodedPassword =
                passwordEncoder.encode(admin.getPassword());

        admin.setPassword(encodedPassword);

        return adminRepository.save(admin);
    }
}