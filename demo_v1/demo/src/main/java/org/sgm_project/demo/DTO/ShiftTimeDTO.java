package org.sgm_project.demo.DTO;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ShiftTimeDTO {
    private String guards;     // รับมาเป็น String ("5") จาก React
    private String startTime;  // รับมาเป็นเวลา "08:00"
    private String endTime;    // รับมาเป็นเวลา "18:00"
    private String headGuard;
}