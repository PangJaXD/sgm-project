package org.sgm_project.demo.DTO;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateCompanyRequest {

    private String company_name;

    private String first_name;
    private String last_name;

    private String phone;
    private String address;
    private String user_detail;

    private LocalDateTime start_date;

    private String profile_img;

    private String username;
    private String password;

    private String admin_name;
}