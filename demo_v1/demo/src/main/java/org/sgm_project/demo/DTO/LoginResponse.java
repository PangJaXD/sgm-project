package org.sgm_project.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
}