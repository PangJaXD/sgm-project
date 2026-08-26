package org.sgm_project.demo.Service;

import org.sgm_project.demo.DTO.CreateCompanyRequest;
import org.sgm_project.demo.Exception.DuplicateUsernameException;
import org.sgm_project.demo.Model.Company;
import org.sgm_project.demo.Repository.CompanyRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    public CompanyService(
            CompanyRepository companyRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
    }


    //we get some request from creating a company
    //as we reach this far you know what im gonna do next
    //that rights we use dto instead
    //we create some empty company and inject it with a dto class
    public Company createCompany(CreateCompanyRequest request) {

        if (companyRepository.existsByUsernameCustom(request.getUsername())) {
            throw new DuplicateUsernameException("Username already exists");
        }

        Company company = new Company();

        company.setCompany_name(request.getCompany_name());

        company.setFirst_name(request.getFirst_name());
        company.setLast_name(request.getLast_name());
        company.setPhone(request.getPhone());
        company.setAddress(request.getAddress());
        company.setUser_detail(request.getUser_detail());
        company.setStart_date(request.getStart_date());
        company.setProfile_img(request.getProfile_img());
        company.setAdmin_name(request.getAdmin_name());

        company.setUsername(request.getUsername());

        // BCrypt password
        company.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        return companyRepository.save(company);
    }
}