package org.sgm_project.demo.Service;

import lombok.Setter;
import org.sgm_project.demo.DTO.CreateGuardRequest;
import org.sgm_project.demo.Model.Guards;
import org.sgm_project.demo.Repository.GuardRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GuardService {
    private final GuardRepository guardRepository;
    private final PasswordEncoder passwordEncoder;

    public GuardService(
            GuardRepository guardRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.guardRepository = guardRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Guards createGuard(
            CreateGuardRequest request
    ) {
        org.sgm_project.demo.Util.UserValidationUtil.validateUsername(request.getUsername());
        org.sgm_project.demo.Util.UserValidationUtil.validatePassword(request.getPassword());

        Guards guard = new Guards();

        guard.setFirst_name(request.getFirst_name());
        guard.setLast_name(request.getLast_name());
        guard.setPhone(request.getPhone());
        guard.setAddress(request.getAddress());
        guard.setUser_detail(request.getUser_detail());
        guard.setStart_date(request.getStart_date());
        guard.setProfile_img(request.getProfile_img());
        guard.setCompany_name(request.getCompany_name());
        guard.setHead_name(request.getHead_name());

        guard.setUsername(request.getUsername());

        // BCrypt
        guard.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        return guardRepository.save(guard);
    }

    public List<Guards> getAllGuards() {
        return guardRepository.findAll();
    }

    public Guards getGuardById(Integer id) {
        return guardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Guard not found"));
    }

    public List<Guards> getActiveGuards() {
        return guardRepository.findActiveGuards();
    }

    public Guards updateGuard(Integer id, Guards guard) {

        Guards existingGuard = guardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Guard not found"));

        existingGuard.setFirst_name(guard.getFirst_name());
        existingGuard.setLast_name(guard.getLast_name());
        existingGuard.setPhone(guard.getPhone());
        existingGuard.setAddress(guard.getAddress());
        existingGuard.setUser_detail(guard.getUser_detail());
        existingGuard.setStart_date(guard.getStart_date());
        existingGuard.setQuit_date(guard.getQuit_date());
        existingGuard.setProfile_img(guard.getProfile_img());
        existingGuard.setUsername(guard.getUsername());

        // เพิ่ม 2 ฟิลด์นี้เข้ามา
        existingGuard.setCompany_name(guard.getCompany_name());
        existingGuard.setHead_name(guard.getHead_name());

        // ตรวจสอบว่ามีการส่งรหัสผ่านใหม่มาหรือไม่ ก่อนเข้ารหัส
        if (guard.getPassword() != null && !guard.getPassword().isEmpty()) {
            existingGuard.setPassword(passwordEncoder.encode(guard.getPassword()));
        }

        existingGuard.setPerformance_score(guard.getPerformance_score());

        return guardRepository.save(existingGuard);
    }
}
