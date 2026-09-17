package org.sgm_project.demo.Service;

import org.sgm_project.demo.DTO.CompanyResponse;
import org.sgm_project.demo.DTO.CreateCompanyRequest;
import org.sgm_project.demo.DTO.UpdateCompanyRequest;
import org.sgm_project.demo.Exception.DuplicateUsernameException;
import org.sgm_project.demo.Exception.ResourceNotFoundException;
import org.sgm_project.demo.Model.Company;
import org.sgm_project.demo.Repository.CompanyRepository;
import org.sgm_project.demo.Repository.GuardRepository;
import org.sgm_project.demo.Repository.UserRepository;
import org.sgm_project.demo.Util.UserValidationUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public CompanyService(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public CompanyResponse createCompany(CreateCompanyRequest request) {
        // Validate Username & Password
        UserValidationUtil.validateUsername(request.getUsername());
        UserValidationUtil.validatePassword(request.getPassword());

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new DuplicateUsernameException("ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น");
        }

        Company company = new Company();
        company.setCompany_name(request.getCompany_name());
        company.setFirst_name(request.getFirst_name() != null ? request.getFirst_name() : request.getCompany_name());
        company.setLast_name(request.getLast_name() != null ? request.getLast_name() : "-");
        company.setPhone(request.getPhone());
        company.setAddress(request.getAddress());
        company.setUser_detail(request.getUser_detail() != null ? request.getUser_detail() : "-");
        company.setStart_date(request.getStart_date() != null ? request.getStart_date() : LocalDateTime.now());
        company.setProfile_img(request.getProfile_img() != null ? request.getProfile_img() : "default.png");
        company.setAdmin_name(request.getAdmin_name() != null ? request.getAdmin_name() : "Admin");
        company.setUsername(request.getUsername());
        company.setPassword(passwordEncoder.encode(request.getPassword()));

        Company saved = companyRepository.save(company);
        return mapToResponse(saved);
    }

    public List<CompanyResponse> getAllCompanies() {
        return companyRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public CompanyResponse getCompanyById(Integer id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ไม่พบข้อมูลบริษัทรักษาความปลอดภัยรหัส: " + id));
        return mapToResponse(company);
    }

    public CompanyResponse updateCompany(Integer id, UpdateCompanyRequest request) {
        Company existing = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ไม่พบข้อมูลบริษัทรักษาความปลอดภัยรหัส: " + id));

        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            UserValidationUtil.validateUsername(request.getUsername());
            if (companyRepository.existsByUsernameAndIdNot(request.getUsername(), id)) {
                throw new DuplicateUsernameException("ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น");
            }
            existing.setUsername(request.getUsername());
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty() && !request.getPassword().startsWith("$2a$")) {
            UserValidationUtil.validatePassword(request.getPassword());
            existing.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getCompany_name() != null) existing.setCompany_name(request.getCompany_name());
        if (request.getFirst_name() != null) existing.setFirst_name(request.getFirst_name());
        if (request.getLast_name() != null) existing.setLast_name(request.getLast_name());
        if (request.getPhone() != null) existing.setPhone(request.getPhone());
        if (request.getAddress() != null) existing.setAddress(request.getAddress());
        if (request.getUser_detail() != null) existing.setUser_detail(request.getUser_detail());
        if (request.getStart_date() != null) existing.setStart_date(request.getStart_date());
        if (request.getProfile_img() != null) existing.setProfile_img(request.getProfile_img());
        if (request.getAdmin_name() != null) existing.setAdmin_name(request.getAdmin_name());

        if (request.getStatus() != null) {
            if ("ปฏิบัติงาน".equals(request.getStatus())) {
                existing.setQuit_date(null);
            } else if (existing.getQuit_date() == null) {
                existing.setQuit_date(LocalDateTime.now());
            }
        } else if (request.getQuit_date() != null) {
            existing.setQuit_date(request.getQuit_date());
        }

        Company updated = companyRepository.save(existing);
        return mapToResponse(updated);
    }

    public void deleteCompany(Integer id) {
        Company existing = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ไม่พบข้อมูลบริษัทรักษาความปลอดภัยรหัส: " + id));
        // Soft delete by default to maintain referential integrity with events/guards
        existing.setQuit_date(LocalDateTime.now());
        companyRepository.save(existing);
    }

    private CompanyResponse mapToResponse(Company company) {
        String status = company.getQuit_date() == null ? "ปฏิบัติงาน" : "พ้นสภาพ";
        long totalEvents = company.getEvents() != null ? company.getEvents().size() : 0L;

        return CompanyResponse.builder()
                .users_id(company.getUsers_id())
                .company_name(company.getCompany_name())
                .first_name(company.getFirst_name())
                .last_name(company.getLast_name())
                .phone(company.getPhone())
                .address(company.getAddress())
                .user_detail(company.getUser_detail())
                .start_date(company.getStart_date())
                .quit_date(company.getQuit_date())
                .profile_img(company.getProfile_img())
                .username(company.getUsername())
                .admin_name(company.getAdmin_name())
                .total_guards(0L)
                .total_events(totalEvents)
                .status(status)
                .build();
    }
}