package org.sgm_project.demo.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;
import java.util.List;
import java.util.Set;

@Getter
@Setter
public class CreateEventRequest {
    private String event_name;
    private String location;
    private String latitude;
    private String longitude;
    private String contractor;
    private String contact;
    private String event_detail;
    private Set<String> required_tools;
    private Set<String> provided_tools;
    private Integer required_guards;

    private Set<ShiftTimeDTO> shift_times; // ใช้ DTO รับข้อมูลกะเวลา

    @JsonProperty("start_date")
    private String start_date;

    @JsonProperty("end_date")
    private String end_date;

    private String status; // <-- เพิ่มบรรทัดนี้
}