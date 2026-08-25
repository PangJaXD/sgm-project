package org.sgm_project.demo.Controller;

import org.sgm_project.demo.Model.Events;
import org.sgm_project.demo.Model.Guards;
import org.sgm_project.demo.Model.Report;
import org.sgm_project.demo.Service.HeadGuardDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/headguard-dashboard")
@CrossOrigin(origins = "*") // อนุญาตให้ React (Vite) ยิง API ได้
public class HeadGuardDashboardController {

    @Autowired
    private HeadGuardDashboardService dashboardService;

    // 1. API ดึงรายชื่อ รปภ. (เมนูเจ้าหน้าที่รปภ.)
    @GetMapping("/guards")
    public ResponseEntity<List<Guards>> getGuardsUnderHead(@RequestParam String headName) {
        List<Guards> guards = dashboardService.getGuardsUnderHead(headName);
        return ResponseEntity.ok(guards);
    }

    // 2. API ดึงงานอีเวนต์ (เมนูงานอีเว้นท์)
    @GetMapping("/events/{headId}")
    public ResponseEntity<List<Events>> getEventsForHeadGuard(@PathVariable Integer headId) {
        List<Events> events = dashboardService.getEventsForHeadGuard(headId);
        return ResponseEntity.ok(events);
    }

    // 3. API ดึงคำร้องขอ/แจ้งเหตุฉุกเฉิน (เมนูคำร้องขอ)
    @GetMapping("/requests")
    public ResponseEntity<List<Report>> getUrgentRequests() {
        List<Report> urgentReports = dashboardService.getUrgentRequests();
        return ResponseEntity.ok(urgentReports);
    }

    @GetMapping("/shifts/{shiftId}/assignments")
    public ResponseEntity<List<Map<String, Object>>> getAssignmentsByShift(@PathVariable Integer shiftId) {
        return ResponseEntity.ok(dashboardService.getAssignmentsByShift(shiftId));
    }

    // 2. อัปเดตสถานะ (ย้ายตัวสำรอง)
    @PutMapping("/assignments/{id}/status")
    public ResponseEntity<?> updateAssignmentStatus(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        dashboardService.updateAssignmentStatus(id, body.get("status"));
        return ResponseEntity.ok().build();
    }

    // 3. บันทึกรายละเอียดมอบหมายงานแผนที่
    @PutMapping("/assignments/{id}/detail")
    public ResponseEntity<?> updateAssignmentDetail(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        dashboardService.updateAssignmentDetail(
                id,
                body.get("status"),
                body.get("latitude"),
                body.get("longitude"),
                body.get("description")
        );
        return ResponseEntity.ok().build();
    }

    @PostMapping("/assignments/request")
    public ResponseEntity<?> createAssignmentRequest(@RequestBody org.sgm_project.demo.DTO.AssignmentRequest request) {
        dashboardService.createAssignment(request);
        return ResponseEntity.ok().body("บันทึกคำขอเข้าทำงานสำเร็จ (RESERVE)");
    }
}