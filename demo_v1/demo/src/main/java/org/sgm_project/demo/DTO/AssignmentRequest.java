package org.sgm_project.demo.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssignmentRequest {

    // ข้อมูลที่จำเป็นสำหรับการเชื่อมความสัมพันธ์
    private Integer guard_id;
    private Integer shift_id;

    // สถานะเริ่มต้น (ฝั่ง Mobile จะส่ง "RESERVE" เข้ามา)
    private String assignment_status;

    // พวกพิกัดและรายละเอียด ให้รับเผื่อไว้ แต่เริ่มต้นมักจะเป็นค่าว่าง (null)
    private String latitude;
    private String longitude;
    private String description;
}