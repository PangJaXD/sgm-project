package org.sgm_project.demo.Service;

import org.sgm_project.demo.DTO.CreateEventRequest;
import org.sgm_project.demo.DTO.ShiftTimeDTO;
import org.sgm_project.demo.Model.Company;
import org.sgm_project.demo.Model.Events;
import org.sgm_project.demo.Model.Guards;
import org.sgm_project.demo.Model.HeadGuard;
import org.sgm_project.demo.Model.ShiftTime;
import org.sgm_project.demo.Repository.CompanyRepository;
import org.sgm_project.demo.Repository.EventRepository;
import org.sgm_project.demo.Repository.GuardRepository;
import org.sgm_project.demo.Repository.HeadGuardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final HeadGuardRepository headGuardRepository;
    private final CompanyRepository companyRepository;
    private final GuardRepository guardRepository;

    public EventService(
            EventRepository eventRepository,
            HeadGuardRepository headGuardRepository,
            CompanyRepository companyRepository,
            GuardRepository guardRepository) {
        this.eventRepository = eventRepository;
        this.headGuardRepository = headGuardRepository;
        this.companyRepository = companyRepository;
        this.guardRepository = guardRepository;
    }

    @Transactional(readOnly = true)
    public List<Events> getAllEvents() {
        return eventRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Events> getEventsForGuardOrTeam(Integer guardId, Integer headId, String headName, String company) {
        if (headId != null) {
            List<Events> evts = eventRepository.findEventsByShiftHeadGuardId(headId);
            if (!evts.isEmpty())
                return evts;
        }

        if (guardId != null) {
            List<Events> guardEvents = eventRepository.findEventsByGuardId(guardId);
            if (guardEvents != null && !guardEvents.isEmpty()) {
                return guardEvents;
            }
            Optional<Guards> gOpt = guardRepository.findById(guardId);
            if (gOpt.isPresent()) {
                Guards g = gOpt.get();
                if (g.getHead_name() != null && !g.getHead_name().trim().isEmpty()) {
                    List<Events> byHead = eventRepository.findEventsByHeadName(g.getHead_name().trim());
                    if (!byHead.isEmpty())
                        return byHead;
                }
                if (g.getCompany_name() != null && !g.getCompany_name().trim().isEmpty()) {
                    return getEventsByCompanyIdentifier(g.getCompany_name().trim());
                }
            }
        }

        if (headName != null && !headName.trim().isEmpty()) {
            List<Events> byHead = eventRepository.findEventsByHeadName(headName.trim());
            if (!byHead.isEmpty())
                return byHead;
        }

        if (company != null && !company.trim().isEmpty()) {
            return getEventsByCompanyIdentifier(company.trim());
        }

        return getAllEvents();
    }

    @Transactional(readOnly = true)
    public String getHeadNameForGuard(Integer guardId) {
        if (guardId == null)
            return null;
        return guardRepository.findById(guardId).map(Guards::getHead_name).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<Events> getEventsByCompany(Integer companyId) {
        if (companyId != null) {
            return eventRepository.findByCompanyId(companyId);
        }
        return eventRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Events> getEventsByCompanyIdentifier(String companyIdentifier) {
        if (companyIdentifier == null || companyIdentifier.trim().isEmpty()) {
            return eventRepository.findAll();
        }
        try {
            int cId = Integer.parseInt(companyIdentifier.trim());
            return eventRepository.findByCompanyId(cId);
        } catch (NumberFormatException ignored) {
        }
        return companyRepository.findAll().stream()
                .filter(c -> companyIdentifier.equalsIgnoreCase(c.getUsername())
                        || companyIdentifier.equalsIgnoreCase(c.getCompany_name()))
                .findFirst()
                .map(company -> eventRepository.findByCompanyId(company.getUsers_id()))
                .orElseGet(() -> eventRepository.findEventsByCompanyName(companyIdentifier.trim()));
    }

    @Transactional(readOnly = true)
    public Events getEventById(Integer id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));
    }

    // this would be a challenge for you
    // same as before i use dto again
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
        event.setCompany_id(request.getCompany_id());
        // this is a shorthand if
        event.setStatus(request.getStatus() != null ? request.getStatus() : "PENDING");
        // setting event img
        event.setEvent_img(
                request.getEvent_img() != null && !request.getEvent_img().trim().isEmpty()
                        ? request.getEvent_img().trim()
                        : "default.png");

        Set<ShiftTime> shiftTimes = new HashSet<>();

        // if you did not select the date
        // it's gonna use current time
        LocalDate finalStartDate = request.getStart_date() != null && !request.getStart_date().isEmpty()
                ? LocalDate.parse(request.getStart_date())
                : LocalDate.now();

        // if you did not select the date
        // it's gonna use current time
        LocalDate finalEndDate = request.getEnd_date() != null && !request.getEnd_date().isEmpty()
                ? LocalDate.parse(request.getEnd_date())
                : finalStartDate;

        event.setStart_date(finalStartDate);
        event.setEnd_date(finalEndDate);

        // if the event gets shift time while saving
        // they gonna save each shift times
        if (request.getShift_times() != null) {
            for (ShiftTimeDTO dto : request.getShift_times()) {
                ShiftTime st = new ShiftTime();

                // 🌟 4. ผูก Event เข้ากับ ShiftTime (Bidirectional Mapping)
                st.setEvent(event);

                st.setMaximum_guards(Integer
                        .parseInt(dto.getGuards() != null && !dto.getGuards().isEmpty() ? dto.getGuards() : "0"));

                LocalTime sTime = dto.getStartTime() != null && !dto.getStartTime().isEmpty()
                        ? LocalTime.parse(dto.getStartTime())
                        : LocalTime.of(8, 0);
                LocalTime eTime = dto.getEndTime() != null && !dto.getEndTime().isEmpty()
                        ? LocalTime.parse(dto.getEndTime())
                        : LocalTime.of(17, 0);

                LocalDate sDate = dto.getShiftDate() != null && !dto.getShiftDate().isEmpty()
                        ? LocalDate.parse(dto.getShiftDate())
                        : finalStartDate;

                st.setShift_date(sDate.atStartOfDay());
                st.setStart_time(LocalDateTime.of(sDate, sTime));
                LocalDate eDate = eTime.isBefore(sTime) ? sDate.plusDays(1) : sDate;
                st.setEnd_time(LocalDateTime.of(eDate, eTime));

                // 🌟 5. ดึง Object HeadGuard จาก DB เพื่อมาผูกกับ ShiftTime
                // find the head id
                // query the headguard
                // and set them for the shift
                if (dto.getHeadGuard() != null && !dto.getHeadGuard().isEmpty()) {
                    Integer headGuardId = Integer.parseInt(dto.getHeadGuard());
                    HeadGuard headGuardObj = headGuardRepository.findById(headGuardId).orElse(null);
                    st.setHeadGuard(headGuardObj);
                } else {
                    st.setHeadGuard(null);
                }

                shiftTimes.add(st);
            }
        }
        event.setShift_times(shiftTimes);
        return eventRepository.save(event);
    }

    // this would be a challenge for you
    // same as before i use dto again
    @Transactional
    // Annotation สำหรับจัดการ Transaction แบบประกาศ (Declarative Transaction
    // Management)
    // ที่ช่วยให้เราควบคุมการทำงานกับฐานข้อมูล (เช่น Commit หรือ Rollback)
    // ได้อย่างอัตโนมัติ
    // โดยไม่ต้องเขียนโค้ดจัดการ Connection, Commit หรือ Rollback ด้วยตัวเอง
    public Events updateEvent(Integer id, CreateEventRequest request) {
        // instead we create empty event
        // we use an existing event
        // cus we need to show current data first
        Events existingEvent = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

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

        if (request.getCompany_id() != null) {
            existingEvent.setCompany_id(request.getCompany_id());
        }

        if (request.getStatus() != null) {
            existingEvent.setStatus(request.getStatus());
        }

        if (request.getEvent_img() != null && !request.getEvent_img().trim().isEmpty()) {
            existingEvent.setEvent_img(request.getEvent_img().trim());
        }

        LocalDate finalStartDate = request.getStart_date() != null && !request.getStart_date().isEmpty()
                ? LocalDate.parse(request.getStart_date())
                : existingEvent.getStart_date();

        LocalDate finalEndDate = request.getEnd_date() != null && !request.getEnd_date().isEmpty()
                ? LocalDate.parse(request.getEnd_date())
                : existingEvent.getEnd_date();

        existingEvent.setStart_date(finalStartDate);
        existingEvent.setEnd_date(finalEndDate);

        Set<ShiftTime> shiftTimes = new HashSet<>();

        if (request.getShift_times() != null) {
            for (ShiftTimeDTO dto : request.getShift_times()) {
                ShiftTime st = new ShiftTime();

                // 🌟 6. ผูก Event เข้ากับ ShiftTime สำหรับตอน Update
                st.setEvent(existingEvent);

                st.setMaximum_guards(Integer
                        .parseInt(dto.getGuards() != null && !dto.getGuards().isEmpty() ? dto.getGuards() : "0"));

                LocalTime sTime = dto.getStartTime() != null && !dto.getStartTime().isEmpty()
                        ? LocalTime.parse(dto.getStartTime())
                        : LocalTime.of(8, 0);
                LocalTime eTime = dto.getEndTime() != null && !dto.getEndTime().isEmpty()
                        ? LocalTime.parse(dto.getEndTime())
                        : LocalTime.of(17, 0);

                LocalDate sDate = dto.getShiftDate() != null && !dto.getShiftDate().isEmpty()
                        ? LocalDate.parse(dto.getShiftDate())
                        : finalStartDate;

                st.setShift_date(sDate.atStartOfDay());
                st.setStart_time(LocalDateTime.of(sDate, sTime));
                LocalDate eDate = eTime.isBefore(sTime) ? sDate.plusDays(1) : sDate;
                st.setEnd_time(LocalDateTime.of(eDate, eTime));

                // 🌟 7. ผูก HeadGuard
                if (dto.getHeadGuard() != null && !dto.getHeadGuard().isEmpty()) {
                    Integer headGuardId = Integer.parseInt(dto.getHeadGuard());
                    HeadGuard headGuardObj = headGuardRepository.findById(headGuardId).orElse(null);
                    st.setHeadGuard(headGuardObj);
                } else {
                    st.setHeadGuard(null);
                }

                shiftTimes.add(st);
            }
        }

        // เคลียร์กะเวลาเดิมทิ้ง แล้วใส่ชุดที่แก้ไขใหม่เข้าไปให้ Orphan Removal ทำงาน
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