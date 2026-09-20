package org.sgm_project.demo.Controller;

import org.sgm_project.demo.DTO.AssignmentRequest;
import org.sgm_project.demo.DTO.ShiftTimeDashboardResponse;
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
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class HeadGuardDashboardController {

    @Autowired
    private HeadGuardDashboardService dashboardService;

    // ==========================================
    // 🌟 1. ดึงข้อมูล Dashboard & เมนูหลัก
    // ==========================================

    // ดึงกะงานตาม HeadGuard ID (สำหรับหน้า Dashboard ใหม่ที่แสดงระดับ Shift)
    @GetMapping("/{headGuardId}/shifts")
    public ResponseEntity<List<ShiftTimeDashboardResponse>> getShiftsForDashboard(
            @PathVariable Integer headGuardId) {
        List<ShiftTimeDashboardResponse> response = dashboardService.getDashboardShifts(headGuardId);
        return ResponseEntity.ok(response);
    }

    // ดึงรายชื่อ รปภ. ใต้บังคับบัญชา (เมนูเจ้าหน้าที่ รปภ.)
    @GetMapping("/guards")
    public ResponseEntity<List<Guards>> getGuardsUnderHead(@RequestParam String headName) {
        List<Guards> guards = dashboardService.getGuardsUnderHead(headName);
        return ResponseEntity.ok(guards);
    }

    // ดึงงานอีเวนต์ทั้งหมดของ HeadGuard (คงไว้สำหรับเมนูงานอีเวนต์เดิม)
    @GetMapping("/events/{headId}")
    public ResponseEntity<List<Events>> getEventsForHeadGuard(@PathVariable Integer headId) {
        List<Events> events = dashboardService.getEventsForHeadGuard(headId);
        return ResponseEntity.ok(events);
    }

    // ดึงคำร้องขอ/แจ้งเหตุฉุกเฉิน (เมนูคำร้องขอ)
    @GetMapping("/requests")
    public ResponseEntity<List<Report>> getUrgentRequests(@RequestParam(required = false) Integer headGuardId) {
        List<Report> urgentReports = dashboardService.getUrgentRequests(headGuardId);
        return ResponseEntity.ok(urgentReports);
    }

    @GetMapping("/{headGuardId}/requests")
    public ResponseEntity<List<Report>> getUrgentRequestsByHeadGuard(@PathVariable Integer headGuardId) {
        List<Report> urgentReports = dashboardService.getUrgentRequests(headGuardId);
        return ResponseEntity.ok(urgentReports);
    }

    // ==========================================
    // 🌟 2. จัดการ Assignments (มอบหมายงาน / ตัวจริง / ตัวสำรอง)
    // ==========================================

    // ดึงรายชื่อ รปภ. ที่ Assign ในกะนั้นๆ (แยกตัวจริง/ตัวสำรอง)
    @GetMapping("/shifts/{shiftId}/assignments")
    public ResponseEntity<List<Map<String, Object>>> getAssignmentsByShift(@PathVariable Integer shiftId) {
        return ResponseEntity.ok(dashboardService.getAssignmentsByShift(shiftId));
    }

    // ย้ายสถานะ รปภ. (เช่น ย้ายจาก RESERVE -> ACTUAL)
    @PutMapping("/assignments/{id}/status")
    public ResponseEntity<?> updateAssignmentStatus(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        dashboardService.updateAssignmentStatus(id, body.get("status"));
        return ResponseEntity.ok().build();
    }

    // บันทึกรายละเอียดการมอบหมายงาน (พิกัดแผนที่ + คำอธิบาย + เปลี่ยนเป็น ASSIGNED)
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

    // สร้างคำขอเข้าทำงาน (สำหรับจำลอง Postman หรือเชื่อมต่อ Mobile ในอนาคต)
    @PostMapping("/assignments/request")
    public ResponseEntity<?> createAssignmentRequest(@RequestBody AssignmentRequest request) {
        dashboardService.createAssignment(request);
        return ResponseEntity.ok().body("บันทึกคำขอเข้าทำงานสำเร็จ (RESERVE)");
    }
}

//THIS CONTROLLER IS FOR HEAD-GUARD-DASHBOARD NOTHING RELATED TO HEAD-GUARD
//mostly it does everything on headguard-dashboard page
