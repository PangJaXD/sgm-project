package org.sgm_project.demo.Service;

import org.sgm_project.demo.Model.*;
import org.sgm_project.demo.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class HeadGuardDashboardService {

    @Autowired
    private GuardRepository guardsRepository;

    @Autowired
    private EventRepository eventsRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private GuardRepository guardRepository;

    @Autowired
    private ShiftTimeRepository shiftTimeRepository;

    // 🌟 เพิ่ม AssignmentsRepository
    @Autowired
    private AssignmentRepository assignmentsRepository;

    public List<Guards> getGuardsUnderHead(String headName) {
        return guardsRepository.findGuardsByHeadName(headName);
    }

    public List<Events> getEventsForHeadGuard(Integer headId) {
        return eventsRepository.findEventsByShiftHeadGuardId(headId);
    }

    public List<Report> getUrgentRequests() {
        return reportRepository.findAbnormalReports();
    }

    // ==========================================
    // 🌟 3 เมธอดใหม่สำหรับจัดการ Assignments
    // ==========================================

    // 1. ดึงข้อมูล Assignments พร้อมชื่อ รปภ. ในกะนั้นๆ
    public List<Map<String, Object>> getAssignmentsByShift(Integer shiftId) {
        return assignmentsRepository.findAssignmentDetailsByShiftId(shiftId);
    }

    // 2. อัปเดตสถานะ (เช่น ย้ายตัวสำรองเป็น ACTUAL)
    public void updateAssignmentStatus(Integer assignmentId, String status) {
        Assignments assignment = assignmentsRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        assignment.setAssignment_status(status);
        assignmentsRepository.save(assignment);
    }

    // 3. บันทึกรายละเอียดการมอบหมายงาน (พร้อมพิกัด)
    public void updateAssignmentDetail(Integer assignmentId, String status, String latitude, String longitude, String description) {
        Assignments assignment = assignmentsRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        assignment.setAssignment_status(status);
        assignment.setLatitude(latitude);
        assignment.setLongitude(longitude);
        assignment.setDescription(description);
        assignmentsRepository.save(assignment);
    }

    public void createAssignment(org.sgm_project.demo.DTO.AssignmentRequest request) {

        // 1. ดึงตัวแม่ทั้งสองตัวขึ้นมาก่อน
        ShiftTime shift = shiftTimeRepository.findById(request.getShift_id())
                .orElseThrow(() -> new RuntimeException("Shift not found"));

        Guards guard = guardRepository.findById(request.getGuard_id())
                .orElseThrow(() -> new RuntimeException("Guard not found"));

        // 2. สร้างตัวลูก
        Assignments newAssignment = new Assignments();
        newAssignment.setAssignment_status(request.getAssignment_status());
        newAssignment.setRequest_date(java.time.LocalDateTime.now());
        newAssignment.setLatitude(request.getLatitude());
        newAssignment.setLongitude(request.getLongitude());
        newAssignment.setDescription(request.getDescription());

        // 🌟 3. ผูกความสัมพันธ์โดยตรงที่ตัวลูก
        newAssignment.setShift(shift);
        newAssignment.setGuard(guard);

        // 4. Save ลูกครั้งเดียวจบ! Database จะมี guard_id และ shift_id ลงไปทันที
        assignmentsRepository.save(newAssignment);
    }
}