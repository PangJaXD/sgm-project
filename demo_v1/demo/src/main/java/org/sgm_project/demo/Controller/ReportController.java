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

@RestController
@RequestMapping("/api/report")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ReportController {

    private final ReportRepository reportRepository;

    public ReportController(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    // 1. ส่งรายงานสถานการณ์/เหตุฉุกเฉินจาก Mobile (POST /api/report)
    @PostMapping
    @Transactional
    public ResponseEntity<Report> submitReport(@RequestBody Map<String, Object> body) {
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
