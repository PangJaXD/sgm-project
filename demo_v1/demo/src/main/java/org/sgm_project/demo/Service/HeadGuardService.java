package org.sgm_project.demo.Service;

import org.sgm_project.demo.DTO.CreateHeadGuardRequest;
import org.sgm_project.demo.DTO.HeadGuardResponse;
import org.sgm_project.demo.Model.HeadGuard;
import org.sgm_project.demo.Repository.HeadGuardRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HeadGuardService {

    private final HeadGuardRepository headGuardRepository;
    private final PasswordEncoder passwordEncoder;

    public HeadGuardService(
            HeadGuardRepository headGuardRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.headGuardRepository = headGuardRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public HeadGuard createHeadGuard(
            CreateHeadGuardRequest request
    ) {
        org.sgm_project.demo.Util.UserValidationUtil.validateUsername(request.getUsername());
        org.sgm_project.demo.Util.UserValidationUtil.validatePassword(request.getPassword());

        HeadGuard headGuard = new HeadGuard();

        headGuard.setFirst_name(request.getFirst_name());
        headGuard.setLast_name(request.getLast_name());
        headGuard.setPhone(request.getPhone());
        headGuard.setAddress(request.getAddress());
        headGuard.setUser_detail(request.getUser_detail());
        headGuard.setStart_date(request.getStart_date());
        headGuard.setProfile_img(request.getProfile_img());
        headGuard.setCompany_name(request.getCompany_name());
        headGuard.setUsername(request.getUsername());

        // BCrypt
        headGuard.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        return headGuardRepository.save(headGuard);
    }

    public List<HeadGuard> getAllHeadGuards() {
        return headGuardRepository.findAll();
    }

    public HeadGuard getHeadGuardById(Integer id) {
        return headGuardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("HeadGuard not found"));
    }

    public List<HeadGuard> getActiveHeadGuards() {
        return headGuardRepository.findActiveHeadGuards();
    }

    public HeadGuard updateHeadGuard(Integer id, HeadGuard headGuard) {

        HeadGuard existingHeadGuard = headGuardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("HeadGuard not found"));

        existingHeadGuard.setFirst_name(headGuard.getFirst_name());
        existingHeadGuard.setLast_name(headGuard.getLast_name());
        existingHeadGuard.setPhone(headGuard.getPhone());
        existingHeadGuard.setAddress(headGuard.getAddress());
        existingHeadGuard.setUser_detail(headGuard.getUser_detail());
        existingHeadGuard.setStart_date(headGuard.getStart_date());
        existingHeadGuard.setQuit_date(headGuard.getQuit_date());
        existingHeadGuard.setProfile_img(headGuard.getProfile_img());
        existingHeadGuard.setUsername(headGuard.getUsername());
        existingHeadGuard.setPassword(passwordEncoder.encode(headGuard.getPassword()));

        existingHeadGuard.setPerformance_score(
                headGuard.getPerformance_score()
        );

        return headGuardRepository.save(existingHeadGuard);
    }

    // เพิ่มเมธอดนี้ใน HeadGuardService
    public HeadGuardResponse mapToResponseDTO(HeadGuard headGuard) {
        return HeadGuardResponse.builder()
                .users_id(headGuard.getUsers_id())
                .username(headGuard.getUsername())
                .first_name(headGuard.getFirst_name())
                .last_name(headGuard.getLast_name())
                .phone(headGuard.getPhone())
                .address(headGuard.getAddress())
                .user_detail(headGuard.getUser_detail())
                .start_date(headGuard.getStart_date())
                .quit_date(headGuard.getQuit_date())
                .profile_img(headGuard.getProfile_img())
                .company_name(headGuard.getCompany_name())
                .performance_score(headGuard.getPerformance_score())
                .build();
    }

    // ปรับ getAll ให้คืนค่าเป็น DTO
    public List<HeadGuardResponse> getAllHeadGuardsResponse() {
        return headGuardRepository.findAll()
                .stream()
                .map(this::mapToResponseDTO)
                .toList();
    }
}