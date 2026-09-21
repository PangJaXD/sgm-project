package org.sgm_project.demo.Controller;

import org.sgm_project.demo.DTO.CreateEventRequest;
import org.sgm_project.demo.Model.Events;
import org.sgm_project.demo.Service.EventService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    // 1. ดึงข้อมูลงานทั้งหมด (GET /api/events?companyId=... หรือ ?company=... หรือ
    // ?guardId=... หรือ ?headName=...)
    @GetMapping
    public ResponseEntity<List<Events>> getAllEvents(
            @RequestParam(required = false) Integer companyId,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) Integer guardId,
            @RequestParam(required = false) Integer headId,
            @RequestParam(required = false) String headName) {
        if (guardId != null || headId != null || (headName != null && !headName.trim().isEmpty())) {
            return ResponseEntity.ok(eventService.getEventsForGuardOrTeam(guardId, headId, headName, company));
        }
        if (companyId != null) {
            return ResponseEntity.ok(eventService.getEventsByCompany(companyId));
        }
        if (company != null && !company.trim().isEmpty()) {
            return ResponseEntity.ok(eventService.getEventsByCompanyIdentifier(company.trim()));
        }
        return ResponseEntity.ok(eventService.getAllEvents());
    }

    // 2. ดึงข้อมูลงานตาม ID (GET /api/events/{id})
    @GetMapping("/{id}")
    public ResponseEntity<Events> getEventById(@PathVariable Integer id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    // 3. สร้างงานใหม่ (POST /api/events)
    @PostMapping
    public ResponseEntity<Events> createEvent(@RequestBody CreateEventRequest request) {
        Events createdEvent = eventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEvent);
    }

    // 4. แก้ไขข้อมูลงาน (PUT /api/events/{id})
    @PutMapping("/{id}")
    public ResponseEntity<Events> updateEvent(
            @PathVariable Integer id,
            @RequestBody CreateEventRequest request) {
        return ResponseEntity.ok(eventService.updateEvent(id, request));
    }

    // 5. ลบข้อมูลงาน (DELETE /api/events/{id})
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Integer id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build(); // คืนค่า Status 204 No Content เมื่อลบสำเร็จ
    }

    // 6. ดึงกะงานทั้งหมดของอีเวนต์นี้ (GET /api/events/{id}/shifts)
    @GetMapping("/{id}/shifts")
    public ResponseEntity<List<java.util.Map<String, Object>>> getEventShifts(
            @PathVariable Integer id,
            @RequestParam(required = false) Integer guardId,
            @RequestParam(required = false) Integer headId,
            @RequestParam(required = false) String headName) {
        Events event = eventService.getEventById(id);
        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();

        String resolvedHeadName = headName;
        if ((resolvedHeadName == null || resolvedHeadName.trim().isEmpty()) && guardId != null) {
            resolvedHeadName = eventService.getHeadNameForGuard(guardId);
        }

        if (event.getShift_times() != null) {
            for (org.sgm_project.demo.Model.ShiftTime st : event.getShift_times()) {
                // Filter by headGuard if requested
                if (headId != null && st.getHeadGuard() != null && !headId.equals(st.getHeadGuard().getUsers_id())) {
                    continue;
                }
                if (resolvedHeadName != null && !resolvedHeadName.trim().isEmpty() && st.getHeadGuard() != null) {
                    String hgFullName = (st.getHeadGuard().getFirst_name() != null ? st.getHeadGuard().getFirst_name()
                            : "") + " "
                            + (st.getHeadGuard().getLast_name() != null ? st.getHeadGuard().getLast_name() : "");
                    hgFullName = hgFullName.trim();
                    String hgUsername = st.getHeadGuard().getUsername() != null ? st.getHeadGuard().getUsername().trim()
                            : "";
                    if (!resolvedHeadName.trim().equalsIgnoreCase(hgFullName)
                            && !resolvedHeadName.trim().equalsIgnoreCase(hgUsername)) {
                        continue;
                    }
                }

                java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
                map.put("shift_id", st.getShift_id());
                map.put("event_id", event.getEvent_id());
                map.put("event_name", event.getEvent_name());
                map.put("shift_date", st.getShift_date() != null ? st.getShift_date().toString() : null);
                map.put("start_time", st.getStart_time() != null ? st.getStart_time().toString() : null);
                map.put("end_time", st.getEnd_time() != null ? st.getEnd_time().toString() : null);
                map.put("maximum_guards", st.getMaximum_guards());

                int currentCount = 0;
                if (st.getAssignment() != null) {
                    currentCount = (int) st.getAssignment().stream()
                            .filter(a -> !"WITHDRAWN".equalsIgnoreCase(a.getAssignment_status()))
                            .count();
                }
                map.put("current_guards", currentCount);
                map.put("available_slots", Math.max(0, st.getMaximum_guards() - currentCount));
                map.put("status", currentCount >= st.getMaximum_guards() ? "FULL" : "OPEN");

                String dutyLoc = event.getLocation();
                map.put("duty_location", dutyLoc != null ? dutyLoc : "จุดตรวจหลัก");
                map.put("title", "กะงานที่ " + st.getShift_id());

                result.add(map);
            }

            // Fallback: If strict filtering resulted in 0 shifts (e.g. shifts have no
            // headGuard assigned yet), return all shifts for the event
            if (result.isEmpty() && !event.getShift_times().isEmpty()) {
                for (org.sgm_project.demo.Model.ShiftTime st : event.getShift_times()) {
                    java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
                    map.put("shift_id", st.getShift_id());
                    map.put("event_id", event.getEvent_id());
                    map.put("event_name", event.getEvent_name());
                    map.put("shift_date", st.getShift_date() != null ? st.getShift_date().toString() : null);
                    map.put("start_time", st.getStart_time() != null ? st.getStart_time().toString() : null);
                    map.put("end_time", st.getEnd_time() != null ? st.getEnd_time().toString() : null);
                    map.put("maximum_guards", st.getMaximum_guards());

                    int currentCount = 0;
                    if (st.getAssignment() != null) {
                        currentCount = (int) st.getAssignment().stream()
                                .filter(a -> !"WITHDRAWN".equalsIgnoreCase(a.getAssignment_status()))
                                .count();
                    }
                    map.put("current_guards", currentCount);
                    map.put("available_slots", Math.max(0, st.getMaximum_guards() - currentCount));
                    map.put("status", currentCount >= st.getMaximum_guards() ? "FULL" : "OPEN");

                    String dutyLoc = event.getLocation();
                    map.put("duty_location", dutyLoc != null ? dutyLoc : "จุดตรวจหลัก");
                    map.put("title", "กะงานที่ " + st.getShift_id());

                    result.add(map);
                }
            }
        }

        return ResponseEntity.ok(result);
    }
}
