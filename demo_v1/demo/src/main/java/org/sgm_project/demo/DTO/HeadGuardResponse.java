package org.sgm_project.demo.DTO;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class HeadGuardResponse {
    private Integer users_id;
    private String username;
    private String first_name;
    private String last_name;
    private String phone;
    private String address;
    private String user_detail;
    private LocalDateTime start_date;
    private LocalDateTime quit_date;
    private String profile_img;

    // ข้อมูลจากฝั่ง HeadGuard / Staff
    private String company_name;
    private Double performance_score;
}