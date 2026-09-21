package org.sgm_project.demo.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import java.util.List;
import java.util.Set;

@Data
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
    private String event_img;
    private Set<String> required_tools;
    private Set<String> provided_tools;
    private Integer required_guards;

    private Set<ShiftTimeDTO> shift_times; // ใช้ DTO รับข้อมูลกะเวลา

    @JsonProperty("start_date")
    private String start_date;

    @JsonProperty("end_date")
    private String end_date;

    private String status; // <-- เพิ่มบรรทัดนี้

    @JsonProperty("company_id")
    private Integer company_id;
}

//@JsonProperty (Jackson): Maps a specific JSON key to a specific Java field
// , especially useful when the JSON key name doesn't match your Java variable name.
//prevent some misunderstanding to both name