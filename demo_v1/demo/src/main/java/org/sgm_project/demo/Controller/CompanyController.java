package org.sgm_project.demo.Controller;

import org.sgm_project.demo.DTO.CreateCompanyRequest;
import org.sgm_project.demo.Model.Company;
import org.sgm_project.demo.Service.CompanyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/company")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class CompanyController {

    //pls use autowired(no controller for this)
    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    //save company
    //instead of using actual class we use its dto
    @PostMapping
    public ResponseEntity<Company> createCompany(
            @RequestBody CreateCompanyRequest request
    ) {

        Company company = companyService.createCompany(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(company);
    }
}
