package org.sgm_project.demo.Service;

import org.sgm_project.demo.DTO.ShiftTimeDashboardResponse;
import org.sgm_project.demo.Model.*;
import org.sgm_project.demo.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


//sry i did not take to gemini very well
//he creates this madness to fuck up my brain
@Service
public class HeadGuardDashboardService {

    @Autowired
    private EventRepository eventsRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private GuardRepository guardRepository;

    @Autowired
    private ShiftTimeRepository shiftTimeRepository;

    @Autowired
    private AssignmentRepository assignmentsRepository;

    public List<Guards> getGuardsUnderHead(String headName) {
        return guardRepository.findGuardsByHeadName(headName);
    }

    public List<Events> getEventsForHeadGuard(Integer headId) {
        return eventsRepository.findEventsByShiftHeadGuardId(headId);
    }

    public List<Report> getUrgentRequests(Integer headGuardId) {
        List<Report> reports;
        if (headGuardId != null) {
            reports = reportRepository.findAbnormalReportsByHeadGuardId(headGuardId);
        } else {
            reports = reportRepository.findAbnormalReports();
        }

        for (Report r : reports) {
            if (r.getShift() != null && r.getShift().getEvent() != null) {
                r.setEventName(r.getShift().getEvent().getEvent_name());
            } else if (r.getShift_id() != null) {
                shiftTimeRepository.findById(r.getShift_id()).ifPresent(st -> {
                    if (st.getEvent() != null) {
                        r.setEventName(st.getEvent().getEvent_name());
                    }
                });
            }
            if (r.getEventName() == null || r.getEventName().trim().isEmpty()) {
                r.setEventName("ไม่ระบุชื่องาน");
            }
        }
        return reports;
    }

    public List<Report> getUrgentRequests() {
        return getUrgentRequests(null);
    }

    // ==========================================
    // 🌟 จัดการ Assignments
    // ==========================================

    public List<Map<String, Object>> getAssignmentsByShift(Integer shiftId) {
        return assignmentsRepository.findAssignmentDetailsByShiftId(shiftId);
    }

    public void updateAssignmentStatus(Integer assignmentId, String status) {
        Assignments assignment = assignmentsRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        assignment.setAssignment_status(status);
        assignmentsRepository.save(assignment);
    }

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
        //first we gonna get ids from mobile side
        ShiftTime shift = shiftTimeRepository.findById(request.getShift_id())
                .orElseThrow(() -> new RuntimeException("Shift not found"));

        Guards guard = guardRepository.findById(request.getGuard_id())
                .orElseThrow(() -> new RuntimeException("Guard not found"));

        //second we inject the request to assignment
        Assignments newAssignment = new Assignments();
        newAssignment.setAssignment_status(request.getAssignment_status());
        newAssignment.setRequest_date(java.time.LocalDateTime.now());
        newAssignment.setLatitude(request.getLatitude());
        newAssignment.setLongitude(request.getLongitude());
        newAssignment.setDescription(request.getDescription());

        newAssignment.setShift(shift);
        newAssignment.setGuard(guard);

        assignmentsRepository.save(newAssignment);
    }

    public List<ShiftTimeDashboardResponse> getDashboardShifts(Integer headGuardId) {
        List<ShiftTime> shifts = shiftTimeRepository.findByHeadGuardId(headGuardId);

        return shifts.stream().map(shift -> {
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

            // Format เวลาทำงาน (Start - End)
            String workTimeFormatted = (shift.getStart_time() != null && shift.getEnd_time() != null)
                    ? shift.getStart_time().format(timeFormatter) + " - " + shift.getEnd_time().format(timeFormatter) + " น."
                    : "ไม่ระบุเวลา";

            // นับจำนวน รปภ. ในกะนี้
            int assignedGuardsCount = assignmentsRepository.countByShiftId(shift.getShift_id());

            // 🌟 รวมชื่อ-นามสกุลของ HeadGuard (ดึงจาก first_name และ last_name ในคลาส Users)
            String headFullName = "ยังไม่ระบุหัวหน้า";
            if (shift.getHeadGuard() != null) {
                String fName = shift.getHeadGuard().getFirst_name() != null ? shift.getHeadGuard().getFirst_name() : "";
                String lName = shift.getHeadGuard().getLast_name() != null ? shift.getHeadGuard().getLast_name() : "";
                headFullName = (fName + " " + lName).trim();
            }

            // ข้อมูล Event ที่ผูกกับ Shift
            Events event = shift.getEvent();
            String eventName = event != null ? event.getEvent_name() : "ไม่ระบุชื่องาน";
            String location = event != null ? event.getLocation() : "ไม่ระบุสถานที่";
            String startDate = (event != null && event.getStart_date() != null) ? event.getStart_date().format(dateFormatter) : "-";
            String endDate = (event != null && event.getEnd_date() != null) ? event.getEnd_date().format(dateFormatter) : "-";
            String status = event != null ? event.getStatus() : "PENDING";

            return ShiftTimeDashboardResponse.builder()
                    .shiftId(Long.valueOf(shift.getShift_id()))
                    .eventName(eventName)
                    .shiftName("กะงานที่ " + shift.getShift_id())
                    .location(location)
                    .startDate(startDate)
                    .endDate(endDate)
                    .workTime(workTimeFormatted)
                    .totalGuards(assignedGuardsCount)
                    .status(status)
                    .headGuardName(headFullName)
                    .build();
        }).collect(Collectors.toList());
    }
}
