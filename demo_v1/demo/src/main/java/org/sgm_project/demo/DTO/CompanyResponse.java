package org.sgm_project.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyResponse {
    private Integer users_id;
    private String company_name;
    private String first_name;
    private String last_name;
    private String phone;
    private String address;
    private String user_detail;
    private LocalDateTime start_date;
    private LocalDateTime quit_date;
    private String profile_img;
    private String username;
    private String admin_name;
    private Long total_guards;
    private Long total_events;
    private String status;
}
