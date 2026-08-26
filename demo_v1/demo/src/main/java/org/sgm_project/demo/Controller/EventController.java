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
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true") // อนุญาตให้ React (Vite) เรียกใช้งาน API ได้
public class EventController {

    //pls use autowired(no controller for this)
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
}