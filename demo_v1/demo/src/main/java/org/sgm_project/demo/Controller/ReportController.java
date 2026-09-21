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

@RestController
@RequestMapping("/api/report")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ReportController {

    private final ReportRepository reportRepository;

    public ReportController(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
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

    // 1.2 ส่งรายงานสถานการณ์พร้อมแนบไฟล์รูปจริงแบบ Multipart Form-Data (POST /api/report)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<Report> submitReportMultipart(
            @RequestParam("guard_id") Integer guardId,
            @RequestParam("shift_id") Integer shiftId,
            @RequestParam(value = "report_type", defaultValue = "ทั่วไป") String reportType,
            @RequestParam(value = "description", required = false, defaultValue = "") String description,
            @RequestParam(value = "is_normal", defaultValue = "true") Boolean isNormal,
            @RequestParam(value = "report_img", required = false) String reportImg,
            @RequestParam(value = "file", required = false) MultipartFile file
    ) {
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

                String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "report.jpg");
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
}
