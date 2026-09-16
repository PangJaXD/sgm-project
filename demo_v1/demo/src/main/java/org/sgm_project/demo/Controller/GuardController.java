package org.sgm_project.demo.Controller;

import org.sgm_project.demo.DTO.CreateGuardRequest;
import org.sgm_project.demo.Model.Assignments;
import org.sgm_project.demo.Model.Guards;
import org.sgm_project.demo.Model.ShiftTime;
import org.sgm_project.demo.Repository.AssignmentRepository;
import org.sgm_project.demo.Service.GuardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/guard")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class GuardController {

    private final GuardService guardService;
    private final AssignmentRepository assignmentRepository;

    public GuardController(GuardService guardService, AssignmentRepository assignmentRepository) {
        this.guardService = guardService;
        this.assignmentRepository = assignmentRepository;
    }

    @PostMapping
    public ResponseEntity<Guards> createGuard(@RequestBody CreateGuardRequest request) {
        Guards guard = guardService.createGuard(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(guard);
    }

    @GetMapping
    public ResponseEntity<List<Guards>> getAllGuards() {
        return ResponseEntity.ok(guardService.getAllGuards());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Guards>> getActiveGuards() {
        return ResponseEntity.ok(guardService.getActiveGuards());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Guards> getGuardById(@PathVariable Integer id) {
        return ResponseEntity.ok(guardService.getGuardById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Guards> updateGuard(
            @PathVariable Integer id,
            @RequestBody Guards guard) {
        return ResponseEntity.ok(guardService.updateGuard(id, guard));
    }

    // ดึงประวัติการทำงานของ Guard (GET /api/guard/{id}/history)
    @GetMapping("/{id}/history")
    public ResponseEntity<List<Map<String, Object>>> getGuardHistory(@PathVariable Integer id) {
        List<Assignments> assignments = assignmentRepository.findByGuardId(id);
        List<Map<String, Object>> result = new ArrayList<>();
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");

        for (Assignments a : assignments) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("history_id", a.getAssignment_id());

            ShiftTime shift = a.getShift();
            if (shift != null && shift.getEvent() != null) {
                item.put("event_name", shift.getEvent().getEvent_name());
                item.put("location", shift.getEvent().getLocation());
            } else {
                item.put("event_name", "งานรักษาความปลอดภัยทั่วไป");
                item.put("location", "มหาวิทยาลัยแม่โจ้");
            }

            if (shift != null) {
                item.put("date", shift.getShift_date() != null ? shift.getShift_date().toString() : null);
                String sTime = shift.getStart_time() != null ? shift.getStart_time().format(timeFmt) : "08:00";
                String eTime = shift.getEnd_time() != null ? shift.getEnd_time().format(timeFmt) : "16:00";
                item.put("shift_time", sTime + " - " + eTime + " น.");
            } else {
                item.put("date", a.getRequest_date() != null ? a.getRequest_date().toString() : null);
                item.put("shift_time", "08:00 - 16:00 น.");
            }

            item.put("check_in_time", "ตรงเวลา");
            String status = "ASSIGNED".equalsIgnoreCase(a.getAssignment_status())
                    ? "ปฏิบัติงานสำเร็จ"
                    : ("RESERVE".equalsIgnoreCase(a.getAssignment_status()) ? "รอปฏิบัติหน้าที่" : "ถอนตัว");
            item.put("status", status);
            item.put("assigned_duty", a.getDescription() != null ? a.getDescription() : "ดูแลความปลอดภัยทั่วไป");
            item.put("report_summary", "เหตุการณ์ปกติ มีการบันทึกการตรวจตราครบถ้วน");

            result.add(item);
        }

        return ResponseEntity.ok(result);
    }
}
