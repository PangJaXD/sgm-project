package org.sgm_project.demo.Controller;

import org.sgm_project.demo.Exception.ResourceNotFoundException;
import org.sgm_project.demo.Model.Report;
import org.sgm_project.demo.Repository.ReportRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.sgm_project.demo.Model.Guards;
import org.sgm_project.demo.Repository.GuardRepository;
import org.sgm_project.demo.Repository.HeadGuardRepository;
import org.sgm_project.demo.Repository.ShiftTimeRepository;

@RestController
@RequestMapping("/api/report")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ReportController {

    private final ReportRepository reportRepository;
    private final ShiftTimeRepository shiftTimeRepository;
    private final GuardRepository guardRepository;
    private final HeadGuardRepository headGuardRepository;

    public ReportController(
            ReportRepository reportRepository,
            ShiftTimeRepository shiftTimeRepository,
            GuardRepository guardRepository,
            HeadGuardRepository headGuardRepository) {
        this.reportRepository = reportRepository;
        this.shiftTimeRepository = shiftTimeRepository;
        this.guardRepository = guardRepository;
        this.headGuardRepository = headGuardRepository;
    }

    // 1.1 ส่งรายงานสถานการณ์/เหตุฉุกเฉินแบบ JSON (POST /api/report)
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public ResponseEntity<Report> submitReportJson(@RequestBody Map<String, Object> body) {
        Report report = new Report();

        Boolean isNormal = true;
        if (body.get("is_normal") instanceof Boolean) {
            isNormal = (Boolean) body.get("is_normal");
        } else if (body.get("is_normal") instanceof Number) {
            isNormal = ((Number) body.get("is_normal")).intValue() == 1;
        }
        report.set_normal(isNormal);

        String type = body.get("report_type") != null ? body.get("report_type").toString() : "ทั่วไป";
        report.setReport_type(type);

        String desc = body.get("description") != null ? body.get("description").toString()
                : (body.get("report_desc") != null ? body.get("report_desc").toString() : "");
        report.setReport_desc(desc);

        String img = body.get("report_img") != null ? body.get("report_img").toString()
                : (body.get("images") != null ? body.get("images").toString() : "default_report.jpg");
        report.setReport_img(img);

        report.setReport_time(LocalDateTime.now());

        if (body.get("guard_id") != null) {
            report.setGuard_id(Integer.parseInt(body.get("guard_id").toString()));
        }
        if (body.get("shift_id") != null) {
            report.setShift_id(Integer.parseInt(body.get("shift_id").toString()));
        }

        Report saved = reportRepository.save(report);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 1.2 ส่งรายงานสถานการณ์พร้อมแนบไฟล์รูปจริงแบบ Multipart Form-Data (POST
    // /api/report)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<Report> submitReportMultipart(
            @RequestParam("guard_id") Integer guardId,
            @RequestParam("shift_id") Integer shiftId,
            @RequestParam(value = "report_type", defaultValue = "ทั่วไป") String reportType,
            @RequestParam(value = "description", required = false, defaultValue = "") String description,
            @RequestParam(value = "is_normal", defaultValue = "true") Boolean isNormal,
            @RequestParam(value = "report_img", required = false) String reportImg,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        Report report = new Report();
        report.setGuard_id(guardId);
        report.setShift_id(shiftId);
        report.setReport_type(reportType);
        report.setReport_desc(description);
        report.set_normal(isNormal);
        report.setReport_time(LocalDateTime.now());

        String finalImage = reportImg != null && !reportImg.trim().isEmpty() ? reportImg.trim() : "default_report.jpg";

        if (file != null && !file.isEmpty()) {
            try {
                Path uploadPath = Paths.get("uploads", "reports");
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }

                String originalFilename = StringUtils
                        .cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "report.jpg");
                String cleanOriginalName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
                String uniqueFilename = UUID.randomUUID().toString() + "_" + cleanOriginalName;

                Path targetLocation = uploadPath.resolve(uniqueFilename);
                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                finalImage = "reports/" + uniqueFilename;
            } catch (IOException e) {
                // Log and keep default if save fails
                System.err.println("Failed to save uploaded report image: " + e.getMessage());
            }
        }

        report.setReport_img(finalImage);
        Report saved = reportRepository.save(report);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // 2. ดึงประวัติรายงานของ Guard (GET /api/report/guard/{guardId})
    @GetMapping("/guard/{guardId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Report>> getReportsByGuard(@PathVariable Integer guardId) {
        return ResponseEntity.ok(reportRepository.findByGuardId(guardId));
    }

    // 3. ดึงรายงานทั้งหมด (GET /api/report)
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<Report>> getAllReports() {
        return ResponseEntity.ok(reportRepository.findAll());
    }

    // 4. ดึงรายงานฉุกเฉิน/ผิดปกติ (GET /api/report/abnormal)
    @GetMapping("/abnormal")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Report>> getAbnormalReports() {
        return ResponseEntity.ok(reportRepository.findAbnormalReports());
    }

    // 5. ดึงรายงานทั้งหมดที่มาจากลูกทีมของ HeadGuard (GET /api/report/headguard/{headGuardId})
    @GetMapping("/headguard/{headGuardId}")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Map<String, Object>>> getReportsByHeadGuard(@PathVariable Integer headGuardId) {
        List<org.sgm_project.demo.Model.ShiftTime> shifts = shiftTimeRepository.findByHeadGuardId(headGuardId);
        List<Integer> shiftIds = new java.util.ArrayList<>();
        Map<Integer, String> shiftToEventName = new java.util.HashMap<>();
        Map<Integer, String> shiftToLocation = new java.util.HashMap<>();
        Map<Integer, String> shiftToTime = new java.util.HashMap<>();

        if (shifts != null) {
            for (var st : shifts) {
                if (st.getShift_id() != null) {
                    shiftIds.add(st.getShift_id());
                    String evName = (st.getEvent() != null && st.getEvent().getEvent_name() != null)
                            ? st.getEvent().getEvent_name() : "ไม่ระบุชื่องาน";
                    String loc = (st.getEvent() != null && st.getEvent().getLocation() != null)
                            ? st.getEvent().getLocation() : "ไม่ระบุสถานที่";
                    shiftToEventName.put(st.getShift_id(), evName);
                    shiftToLocation.put(st.getShift_id(), loc);
                    String timeStr = (st.getStart_time() != null ? st.getStart_time().toString() : "")
                            + (st.getEnd_time() != null ? " - " + st.getEnd_time().toString() : "");
                    shiftToTime.put(st.getShift_id(), timeStr);
                }
            }
        }

        List<Report> reports;
        if (!shiftIds.isEmpty()) {
            reports = reportRepository.findAllReportsByShiftIds(shiftIds);
            if (reports == null || reports.isEmpty()) {
                reports = reportRepository.findAllReportsByHeadGuardId(headGuardId);
            }
        } else {
            reports = reportRepository.findAllReportsByHeadGuardId(headGuardId);
        }

        if (reports == null) {
            reports = new java.util.ArrayList<>();
        } else {
            reports = new java.util.ArrayList<>(reports);
        }

        // Also check if guards under this head guard reported anything
        var hgOpt = headGuardRepository.findById(headGuardId);
        if (hgOpt.isPresent()) {
            String headFullName = ((hgOpt.get().getFirst_name() != null ? hgOpt.get().getFirst_name() : "") + " "
                    + (hgOpt.get().getLast_name() != null ? hgOpt.get().getLast_name() : "")).trim();
            if (!headFullName.isEmpty()) {
                List<Guards> teamGuards = guardRepository.findGuardsByHeadName(headFullName);
                for (Guards g : teamGuards) {
                    if (g.getUsers_id() != null) {
                        List<Report> gReports = reportRepository.findByGuardId(g.getUsers_id());
                        if (gReports != null) {
                            for (Report gr : gReports) {
                                boolean exists = reports.stream().anyMatch(r -> r.getReport_id().equals(gr.getReport_id()));
                                if (!exists) {
                                    reports.add(gr);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Sort latest first
        reports.sort((r1, r2) -> {
            if (r1.getReport_time() != null && r2.getReport_time() != null) {
                return r2.getReport_time().compareTo(r1.getReport_time());
            }
            return (r2.getReport_id() != null ? r2.getReport_id() : 0) - (r1.getReport_id() != null ? r1.getReport_id() : 0);
        });

        // Map to detailed DTO
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Report r : reports) {
            Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("report_id", r.getReport_id());
            map.put("report_type", r.getReport_type());
            map.put("report_desc", r.getReport_desc());
            map.put("description", r.getReport_desc());
            map.put("report_img", r.getReport_img());
            map.put("images", r.getReport_img());
            map.put("report_time", r.getReport_time() != null ? r.getReport_time().toString() : null);
            map.put("is_normal", r.is_normal());
            map.put("guard_id", r.getGuard_id());
            map.put("shift_id", r.getShift_id());

            // Guard info
            if (r.getGuard_id() != null) {
                var gOpt = guardRepository.findById(r.getGuard_id());
                if (gOpt.isPresent()) {
                    Guards g = gOpt.get();
                    map.put("guard_name", ((g.getFirst_name() != null ? g.getFirst_name() : "") + " "
                            + (g.getLast_name() != null ? g.getLast_name() : "")).trim());
                    map.put("guard_phone", g.getPhone());
                }
            }

            // Event & shift info
            String evName = r.getEventName();
            String loc = null;
            if (r.getShift_id() != null && shiftToEventName.containsKey(r.getShift_id())) {
                evName = shiftToEventName.get(r.getShift_id());
                loc = shiftToLocation.get(r.getShift_id());
            }
            if (evName == null && r.getShift() != null && r.getShift().getEvent() != null) {
                evName = r.getShift().getEvent().getEvent_name();
                loc = r.getShift().getEvent().getLocation();
            }
            map.put("event_name", evName != null ? evName : "งานรักษาความปลอดภัย");
            map.put("location", loc != null ? loc : "จุดตรวจประจำการ");

            result.add(map);
        }

        return ResponseEntity.ok(result);
    }
}
