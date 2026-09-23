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
            PasswordEncoder passwordEncoder) {
        this.headGuardRepository = headGuardRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public HeadGuard createHeadGuard(
            CreateHeadGuardRequest request) {
        org.sgm_project.demo.Util.UserValidationUtil.validateUsername(request.getUsername());
        org.sgm_project.demo.Util.UserValidationUtil.validatePassword(request.getPassword());
        org.sgm_project.demo.Util.UserValidationUtil.validatePhone(request.getPhone());

        HeadGuard headGuard = new HeadGuard();

        headGuard.setRank(request.getRank() != null && !request.getRank().trim().isEmpty() ? request.getRank().trim() : "-");
        headGuard.setTitle(request.getTitle() != null && !request.getTitle().trim().isEmpty() ? request.getTitle().trim() : "-");
        headGuard.setFirst_name(request.getFirst_name());
        headGuard.setLast_name(request.getLast_name());
        headGuard.setGender(request.getGender() != null && !request.getGender().trim().isEmpty() ? request.getGender().trim() : "-");
        headGuard.setPhone(request.getPhone());
        headGuard.setAddress(request.getAddress());
        headGuard.setUser_detail(request.getUser_detail());
        headGuard.setStart_date(request.getStart_date());
        headGuard.setProfile_img(request.getProfile_img());
        headGuard.setCompany_name(request.getCompany_name());
        headGuard.setUsername(request.getUsername());

        // BCrypt
        headGuard.setPassword(
                passwordEncoder.encode(request.getPassword()));

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

        existingHeadGuard.setRank(headGuard.getRank() != null && !headGuard.getRank().trim().isEmpty() ? headGuard.getRank().trim() : "-");
        existingHeadGuard.setTitle(headGuard.getTitle() != null && !headGuard.getTitle().trim().isEmpty() ? headGuard.getTitle().trim() : "-");
        existingHeadGuard.setFirst_name(headGuard.getFirst_name());
        existingHeadGuard.setLast_name(headGuard.getLast_name());
        existingHeadGuard.setGender(headGuard.getGender() != null && !headGuard.getGender().trim().isEmpty() ? headGuard.getGender().trim() : "-");
        if (headGuard.getPhone() != null && !headGuard.getPhone().trim().isEmpty()) {
            org.sgm_project.demo.Util.UserValidationUtil.validatePhone(headGuard.getPhone());
            existingHeadGuard.setPhone(headGuard.getPhone().trim());
        }
        existingHeadGuard.setAddress(headGuard.getAddress());
        existingHeadGuard.setUser_detail(headGuard.getUser_detail());
        existingHeadGuard.setStart_date(headGuard.getStart_date());
        existingHeadGuard.setQuit_date(headGuard.getQuit_date());
        existingHeadGuard.setProfile_img(headGuard.getProfile_img());
        existingHeadGuard.setUsername(headGuard.getUsername());
        if (headGuard.getPassword() != null && !headGuard.getPassword().isEmpty()) {
            existingHeadGuard.setPassword(passwordEncoder.encode(headGuard.getPassword()));
        }

        existingHeadGuard.setPerformance_score(
                headGuard.getPerformance_score());

        return headGuardRepository.save(existingHeadGuard);
    }

    // เพิ่มเมธอดนี้ใน HeadGuardService
    public HeadGuardResponse mapToResponseDTO(HeadGuard headGuard) {
        return HeadGuardResponse.builder()
                .users_id(headGuard.getUsers_id())
                .username(headGuard.getUsername())
                .rank(headGuard.getRank() != null ? headGuard.getRank() : "-")
                .title(headGuard.getTitle() != null ? headGuard.getTitle() : "-")
                .first_name(headGuard.getFirst_name())
                .last_name(headGuard.getLast_name())
                .gender(headGuard.getGender() != null ? headGuard.getGender() : "-")
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

    // ดึงเฉพาะ HeadGuard ที่สังกัดบริษัทที่ระบุ
    public List<HeadGuardResponse> getHeadGuardsByCompanyResponse(String company) {
        return headGuardRepository.findByCompanyIdentifier(company)
                .stream()
                .map(this::mapToResponseDTO)
                .toList();
    }
}