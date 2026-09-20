package org.sgm_project.demo.Controller;

import org.sgm_project.demo.DTO.AssignmentRequest;
import org.sgm_project.demo.Exception.ResourceNotFoundException;
import org.sgm_project.demo.Model.Assignments;
import org.sgm_project.demo.Model.Events;
import org.sgm_project.demo.Model.Guards;
import org.sgm_project.demo.Model.ShiftTime;
import org.sgm_project.demo.Repository.AssignmentRepository;
import org.sgm_project.demo.Repository.GuardRepository;
import org.sgm_project.demo.Repository.ShiftTimeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/assignment")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class AssignmentController {

    private final AssignmentRepository assignmentRepository;
    private final ShiftTimeRepository shiftTimeRepository;
    private final GuardRepository guardRepository;

    public AssignmentController(
            AssignmentRepository assignmentRepository,
            ShiftTimeRepository shiftTimeRepository,
            GuardRepository guardRepository) {
        this.assignmentRepository = assignmentRepository;
        this.shiftTimeRepository = shiftTimeRepository;
        this.guardRepository = guardRepository;
    }

    private Map<String, Object> mapAssignmentToDTO(Assignments a) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("assignment_id", a.getAssignment_id());
        map.put("assignment_status", a.getAssignment_status() != null ? a.getAssignment_status() : "RESERVE");
        map.put("description", a.getDescription() != null ? a.getDescription() : "ปฏิบัติหน้าที่รักษาความปลอดภัย");
        map.put("latitude", a.getLatitude());
        map.put("longitude", a.getLongitude());
        map.put("request_date", a.getRequest_date() != null ? a.getRequest_date().toString() : null);

        if (a.getGuard() != null) {
            map.put("guard_id", a.getGuard().getUsers_id());
            map.put("guard_name", (a.getGuard().getFirst_name() != null ? a.getGuard().getFirst_name() : "") + " " +
                    (a.getGuard().getLast_name() != null ? a.getGuard().getLast_name() : ""));
        }

        ShiftTime shift = a.getShift();
        if (shift != null) {
            map.put("shift_id", shift.getShift_id());
            map.put("shift_date", shift.getShift_date() != null ? shift.getShift_date().toString() : null);
            map.put("start_time", shift.getStart_time() != null ? shift.getStart_time().toString() : null);
            map.put("end_time", shift.getEnd_time() != null ? shift.getEnd_time().toString() : null);
            map.put("maximum_guards", shift.getMaximum_guards());

            Events event = shift.getEvent();
            if (event != null) {
                map.put("event_id", event.getEvent_id());
                map.put("event_name", event.getEvent_name());
                map.put("location", event.getLocation());
                map.put("contractor", event.getContractor());
                map.put("contact", event.getContact());
                map.put("event_img", event.getEvent_img());
                map.put("start_date", event.getStart_date() != null ? event.getStart_date().toString() : null);
                map.put("end_date", event.getEnd_date() != null ? event.getEnd_date().toString() : null);
                map.put("required_tools", event.getRequired_tools());
                map.put("provided_tools", event.getProvided_tools());
            }
        }

        return map;
    }

    // 1. ดึงรายการมอบหมายงานทั้งหมดของ Guard (GET /api/assignment/guard/{guardId})
    @GetMapping("/guard/{guardId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getAssignmentsByGuard(@PathVariable Integer guardId) {
        List<Assignments> list = assignmentRepository.findByGuardId(guardId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Assignments a : list) {
            result.add(mapAssignmentToDTO(a));
        }
        return ResponseEntity.ok(result);
    }

    // 2. ดึงกะงานปัจจุบันที่กำลังทำอยู่หรือล่าสุดของ Guard (GET
    // /api/assignment/guard/{guardId}/active)
    @GetMapping("/guard/{guardId}/active")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getActiveAssignmentByGuard(@PathVariable Integer guardId) {
        List<Assignments> list = assignmentRepository.findByGuardId(guardId);

        // ให้สิทธิ์งานที่เป็น ASSIGNED ก่อน แล้วค่อย RESERVE โดยไม่เอางาน WITHDRAWN
        Assignments active = list.stream()
                .filter(a -> !"WITHDRAWN".equalsIgnoreCase(a.getAssignment_status()))
                .sorted((a1, a2) -> {
                    boolean a1Assigned = "ASSIGNED".equalsIgnoreCase(a1.getAssignment_status());
                    boolean a2Assigned = "ASSIGNED".equalsIgnoreCase(a2.getAssignment_status());
                    if (a1Assigned && !a2Assigned)
                        return -1;
                    if (!a1Assigned && a2Assigned)
                        return 1;
                    return (a2.getAssignment_id() != null ? a2.getAssignment_id() : 0)
                            - (a1.getAssignment_id() != null ? a1.getAssignment_id() : 0);
                })
                .findFirst()
                .orElse(null);

        if (active == null) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(mapAssignmentToDTO(active));
    }

    // 3. ส่งคำร้องขอเข้าทำงาน (POST /api/assignment/request)
    @PostMapping("/request")
    @Transactional
    public ResponseEntity<Map<String, Object>> createAssignmentRequest(@RequestBody AssignmentRequest request) {
        if (request.getShift_id() == null || request.getGuard_id() == null) {
            throw new IllegalArgumentException("shift_id และ guard_id ต้องไม่เป็นค่าว่าง");
        }

        ShiftTime shift = shiftTimeRepository.findById(request.getShift_id())
                .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", request.getShift_id()));

        Guards guard = guardRepository.findById(request.getGuard_id())
                .orElseThrow(() -> new ResourceNotFoundException("Guard", "id", request.getGuard_id()));

        // ตรวจสอบว่าเคยสมัครกะนี้ไปแล้วหรือยัง
        Optional<Assignments> existing = assignmentRepository.findByGuardIdAndShiftId(request.getGuard_id(),
                request.getShift_id());
        if (existing.isPresent()) {
            Assignments exist = existing.get();
            if ("WITHDRAWN".equalsIgnoreCase(exist.getAssignment_status())) {
                exist.setAssignment_status(
                        request.getAssignment_status() != null ? request.getAssignment_status() : "RESERVE");
                exist.setRequest_date(LocalDateTime.now());
                Assignments saved = assignmentRepository.save(exist);
                return ResponseEntity.ok(mapAssignmentToDTO(saved));
            }
            return ResponseEntity.ok(mapAssignmentToDTO(exist));
        }

        Assignments newAssignment = new Assignments();
        newAssignment.setAssignment_status(
                request.getAssignment_status() != null && !request.getAssignment_status().trim().isEmpty()
                        ? request.getAssignment_status().trim()
                        : "RESERVE");
        newAssignment.setRequest_date(LocalDateTime.now());
        newAssignment.setLatitude(request.getLatitude());
        newAssignment.setLongitude(request.getLongitude());
        newAssignment.setDescription(
                request.getDescription() != null ? request.getDescription() : "รอการมอบหมายจุดปฏิบัติการ");
        newAssignment.setShift(shift);
        newAssignment.setGuard(guard);
        if (shift.getHeadGuard() != null) {
            newAssignment.setHeadGuard(shift.getHeadGuard());
        }

        Assignments saved = assignmentRepository.save(newAssignment);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapAssignmentToDTO(saved));
    }

    // 4. ถอนตัวจากกะงาน (POST /api/assignment/{id}/withdraw หรือ POST /api/assignment/withdraw)
    @PostMapping("/{id}/withdraw")
    @Transactional
    public ResponseEntity<?> withdrawAssignment(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, Object> body) {
        Assignments assignment = null;
        if (body != null && body.containsKey("guard_id")) {
            try {
                int gId = Integer.parseInt(body.get("guard_id").toString());
                assignment = assignmentRepository.findByGuardIdAndShiftId(gId, id).orElse(null);
            } catch (Exception ignored) {}
        }
        if (assignment == null) {
            assignment = assignmentRepository.findById(id).orElse(null);
        }
        if (assignment == null) {
            throw new ResourceNotFoundException("Assignment", "id", id);
        }

        assignment.setAssignment_status("WITHDRAWN");
        if (body != null && body.containsKey("reason")) {
            assignment.setDescription("ถอนตัว: " + body.get("reason")
                    + (body.containsKey("details") ? " (" + body.get("details") + ")" : ""));
        }
        assignmentRepository.save(assignment);
        return ResponseEntity.ok(Map.of("message", "ถอนตัวจากการปฏิบัติหน้าที่เรียบร้อยแล้ว"));
    }

    @PostMapping("/withdraw")
    @Transactional
    public ResponseEntity<?> withdrawByGuardAndShift(
            @RequestBody Map<String, Object> body) {
        if (body == null || !body.containsKey("guard_id") || !body.containsKey("shift_id")) {
            throw new IllegalArgumentException("guard_id และ shift_id ต้องไม่เป็นค่าว่าง");
        }
        int gId = Integer.parseInt(body.get("guard_id").toString());
        int sId = Integer.parseInt(body.get("shift_id").toString());
        Assignments assignment = assignmentRepository.findByGuardIdAndShiftId(gId, sId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment for guard " + gId + " and shift", "id", sId));

        assignment.setAssignment_status("WITHDRAWN");
        if (body.containsKey("reason")) {
            assignment.setDescription("ถอนตัว: " + body.get("reason")
                    + (body.containsKey("details") ? " (" + body.get("details") + ")" : ""));
        }
        assignmentRepository.save(assignment);
        return ResponseEntity.ok(Map.of("message", "ถอนตัวจากการปฏิบัติหน้าที่เรียบร้อยแล้ว"));
    }

    // 5. ดูรายละเอียดการมอบหมายงานเดี่ยว (GET /api/assignment/{id})
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getAssignmentById(@PathVariable Integer id) {
        Assignments assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", id));
        return ResponseEntity.ok(mapAssignmentToDTO(assignment));
    }
}
