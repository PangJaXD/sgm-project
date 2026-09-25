package org.sgm_project.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {

    private Integer users_id;
    private String username;
    private String role;

    private String first_name;
    private String last_name;
    private String company_name;
    private String head_name;
    private String status;
    private LocalDateTime start_date;

    public LoginResponse(Integer users_id, String username, String role, String first_name, String last_name,
            String company_name) {
        this(users_id, username, role, first_name, last_name, company_name, null, null, null);
    }

    public LoginResponse(Integer users_id, String username, String role, String first_name, String last_name,
            String company_name, String head_name) {
        this(users_id, username, role, first_name, last_name, company_name, head_name, null, null);
    }
}