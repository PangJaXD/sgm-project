package org.sgm_project.demo.DTO;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class ShiftTimeDTO {
    private String guards;     // รับมาเป็น String ("5") จาก React
    @JsonProperty("shiftDate")
    @JsonAlias({"shift_date"})
    private String shiftDate;  // รับมาเป็นวันที่ "2026-09-20"
    private String startTime;  // รับมาเป็นเวลา "08:00"
    private String endTime;    // รับมาเป็นเวลา "18:00"
    private String headGuard;
}