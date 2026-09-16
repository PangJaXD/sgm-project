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

    // 1. ดึงข้อมูลงานทั้งหมด (GET /api/events)
    @GetMapping
    public ResponseEntity<List<Events>> getAllEvents() {
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
    public ResponseEntity<List<java.util.Map<String, Object>>> getEventShifts(@PathVariable Integer id) {
        Events event = eventService.getEventById(id);
        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();

        if (event.getShift_times() != null) {
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

        return ResponseEntity.ok(result);
    }
}
