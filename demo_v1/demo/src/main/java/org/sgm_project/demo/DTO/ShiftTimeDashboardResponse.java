package org.sgm_project.demo.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.sgm_project.demo.Model.HeadGuard;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Data
@Builder
public class ShiftTimeDashboardResponse {
    private Long shiftId;
    private Integer eventId;
    @JsonProperty("guard_visible")
    private boolean guard_visible;
    private String eventName; // เช่น "คอนเสิร์ตเขาใหญ่ Mountain Fest 2026"
    private String shiftName; // เช่น "กะที่ 1"
    private String location; // เช่น "เขาใหญ่"
    private String startDate; // 2026-10-20
    private String endDate; // 2026-10-25
    private String workTime; // "08:00 - 18:00 น."
    private int totalGuards; // จำนวนเจ้าหน้าที่ 6 คน
    private String status; // "รอดำเนินการ" หรือ "กำลังดำเนินการ"
    private String headGuardName; // "นาย สมชาย รักดี"
}