package org.sgm_project.demo.Controller;

import org.sgm_project.demo.DTO.CompanyResponse;
import org.sgm_project.demo.DTO.CreateCompanyRequest;
import org.sgm_project.demo.DTO.UpdateCompanyRequest;
import org.sgm_project.demo.Service.CompanyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/company")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @PostMapping
    public ResponseEntity<CompanyResponse> createCompany(
            @RequestBody CreateCompanyRequest request) {
        CompanyResponse company = companyService.createCompany(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(company);
    }

    @GetMapping
    public ResponseEntity<List<CompanyResponse>> getAllCompanies(
            @RequestParam(required = false) String adminName,
            @RequestParam(required = false) String adminUsername) {
        if ((adminName != null && !adminName.trim().isEmpty())
                || (adminUsername != null && !adminUsername.trim().isEmpty())) {
            return ResponseEntity.ok(companyService.getCompaniesByAdmin(adminName, adminUsername));
        }
        return ResponseEntity.ok(companyService.getAllCompanies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyResponse> getCompanyById(@PathVariable Integer id) {
        return ResponseEntity.ok(companyService.getCompanyById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompanyResponse> updateCompany(
            @PathVariable Integer id,
            @RequestBody UpdateCompanyRequest request) {
        return ResponseEntity.ok(companyService.updateCompany(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteCompany(@PathVariable Integer id) {
        companyService.deleteCompany(id);
        return ResponseEntity.ok(Map.of("message", "ลบบริษัทรักษาความปลอดภัยเรียบร้อยแล้ว", "success", true));
    }
}
