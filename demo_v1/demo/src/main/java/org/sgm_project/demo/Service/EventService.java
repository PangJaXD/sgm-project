package org.sgm_project.demo.Service;

import org.sgm_project.demo.DTO.CreateEventRequest;
import org.sgm_project.demo.DTO.ShiftTimeDTO;
import org.sgm_project.demo.Model.Events;
import org.sgm_project.demo.Model.ShiftTime;
import org.sgm_project.demo.Repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class EventService {

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    // ใส่ Transactional(readOnly = true) เพื่อประสิทธิภาพในการดึงข้อมูล
    @Transactional(readOnly = true)
    public List<Events> getAllEvents() {
        return eventRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Events getEventById(Integer id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
    }

    @Transactional
    public Events createEvent(CreateEventRequest request) {
        Events event = new Events();

        event.setEvent_name(request.getEvent_name());
        event.setLocation(request.getLocation());
        event.setLatitude(request.getLatitude());
        event.setLongitude(request.getLongitude());
        event.setContractor(request.getContractor());
        event.setContact(request.getContact());
        event.setEvent_detail(request.getEvent_detail());
        event.setRequired_tools(request.getRequired_tools());
        event.setProvided_tools(request.getProvided_tools());
        event.setRequired_guards(request.getRequired_guards());
        event.setStatus(request.getStatus() != null ? request.getStatus() : "PENDING");

        // ป้องกัน Error รูปภาพ
        event.setEvent_img("default.png");

        Set<ShiftTime> shiftTimes = new HashSet<>();

// 1. ดึงวันที่เดิมจากฐานข้อมูลมาก่อน (เผื่อ Frontend ส่งมาเป็น Null)
        LocalDate finalStartDate = event.getStart_date();

// 2. ถ้า Frontend ส่งข้อมูลใหม่มา และไม่เป็นค่าว่าง ค่อยอัปเดตทับ
        if (request.getStart_date() != null && !request.getStart_date().isEmpty()) {
            finalStartDate = LocalDate.parse(request.getStart_date());
        }

        LocalDate finalEndDate = event.getEnd_date();
        if (request.getEnd_date() != null && !request.getEnd_date().isEmpty()) {
            finalEndDate = LocalDate.parse(request.getEnd_date());
        }

// 3. เซ็ตค่าลง Entity
        event.setStart_date(finalStartDate);
        event.setEnd_date(finalEndDate);

        if (request.getShift_times() != null) {
            for (ShiftTimeDTO dto : request.getShift_times()) {
                ShiftTime st = new ShiftTime();
                st.setMaximum_guards(Integer.parseInt(dto.getGuards() != null && !dto.getGuards().isEmpty() ? dto.getGuards() : "0"));

                LocalTime sTime = LocalTime.of(8, 0);
                if (dto.getStartTime() != null && !dto.getStartTime().isEmpty()) sTime = LocalTime.parse(dto.getStartTime());

                LocalTime eTime = LocalTime.of(17, 0);
                if (dto.getEndTime() != null && !dto.getEndTime().isEmpty()) eTime = LocalTime.parse(dto.getEndTime());

                // 🌟 ใช้ startDate ที่ตรวจสอบแล้วมาประกอบร่าง
                st.setShift_date(finalStartDate.atStartOfDay());
                st.setStart_time(LocalDateTime.of(finalStartDate, sTime));
                st.setEnd_time(LocalDateTime.of(finalEndDate, eTime));

                if (dto.getHeadGuard() != null && !dto.getHeadGuard().isEmpty()) {
                    st.setHead_guard_id(Integer.parseInt(dto.getHeadGuard()));
                } else {
                    st.setHead_guard_id(null);
                }

                shiftTimes.add(st);
            }
        }
        event.setShift_times(shiftTimes);
        return eventRepository.save(event);
    }

    @Transactional
    public Events updateEvent(Integer id, CreateEventRequest request) { // <-- เปลี่ยนรับ DTO
        Events existingEvent = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        // อัปเดตข้อมูลทั่วไป
        existingEvent.setEvent_name(request.getEvent_name());
        existingEvent.setLocation(request.getLocation());
        existingEvent.setLatitude(request.getLatitude());
        existingEvent.setLongitude(request.getLongitude());
        existingEvent.setContractor(request.getContractor());
        existingEvent.setContact(request.getContact());
        existingEvent.setEvent_detail(request.getEvent_detail());
        existingEvent.setRequired_tools(request.getRequired_tools());
        existingEvent.setProvided_tools(request.getProvided_tools());
        existingEvent.setRequired_guards(request.getRequired_guards());



        if(request.getStatus() != null) {
            existingEvent.setStatus(request.getStatus());
        }

        // === ส่วนแปลง DTO ให้เป็น ShiftTime Entity (มีระบบดัก Null) ===
        java.util.Set<ShiftTime> shiftTimes = new java.util.HashSet<>();

// 1. ดึงวันที่เดิมจากฐานข้อมูลมาก่อน (เผื่อ Frontend ส่งมาเป็น Null)
        LocalDate finalStartDate = existingEvent.getStart_date();

// 2. ถ้า Frontend ส่งข้อมูลใหม่มา และไม่เป็นค่าว่าง ค่อยอัปเดตทับ
        if (request.getStart_date() != null && !request.getStart_date().isEmpty()) {
            finalStartDate = LocalDate.parse(request.getStart_date());
        }

        LocalDate finalEndDate = existingEvent.getEnd_date();
        if (request.getEnd_date() != null && !request.getEnd_date().isEmpty()) {
            finalEndDate = LocalDate.parse(request.getEnd_date());
        }

// 3. เซ็ตค่าลง Entity
        existingEvent.setStart_date(finalStartDate);
        existingEvent.setEnd_date(finalEndDate);

        if (request.getShift_times() != null) {
            for (ShiftTimeDTO dto : request.getShift_times()) {
                ShiftTime st = new ShiftTime();
                st.setMaximum_guards(Integer.parseInt(dto.getGuards() != null && !dto.getGuards().isEmpty() ? dto.getGuards() : "0"));

                LocalTime sTime = LocalTime.of(8, 0);
                if (dto.getStartTime() != null && !dto.getStartTime().isEmpty()) sTime = LocalTime.parse(dto.getStartTime());

                LocalTime eTime = LocalTime.of(17, 0);
                if (dto.getEndTime() != null && !dto.getEndTime().isEmpty()) eTime = LocalTime.parse(dto.getEndTime());

                // 🌟 ใช้ startDate ที่ตรวจสอบแล้วมาประกอบร่าง
                st.setShift_date(finalStartDate.atStartOfDay());
                st.setStart_time(LocalDateTime.of(finalStartDate, sTime));
                st.setEnd_time(LocalDateTime.of(finalEndDate, eTime));

                if (dto.getHeadGuard() != null && !dto.getHeadGuard().isEmpty()) {
                    st.setHead_guard_id(Integer.parseInt(dto.getHeadGuard()));
                } else {
                    st.setHead_guard_id(null);
                }

                shiftTimes.add(st);
            }
        }

        existingEvent.getShift_times().clear();
        existingEvent.getShift_times().addAll(shiftTimes);

        // เคลียร์กะเวลาเดิมทิ้ง แล้วใส่ชุดที่แก้ไขใหม่เข้าไป (เพื่อให้ Orphan Removal ทำงานลบตัวเก่าทิ้ง)
        existingEvent.getShift_times().clear();
        existingEvent.getShift_times().addAll(shiftTimes);

        return eventRepository.save(existingEvent);
    }

    @Transactional
    public void deleteEvent(Integer id) {
        if (!eventRepository.existsById(id)) {
            throw new RuntimeException("Event not found");
        }
        eventRepository.deleteById(id);
    }
}