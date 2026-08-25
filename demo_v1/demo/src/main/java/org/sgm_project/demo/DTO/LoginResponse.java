package org.sgm_project.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResponse {

    private Integer users_id;
    private String username;
    private String role;

    private String first_name;
    private String last_name;
}