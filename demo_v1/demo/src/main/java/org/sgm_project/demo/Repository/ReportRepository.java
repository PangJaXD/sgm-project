package org.sgm_project.demo.Repository;

import org.sgm_project.demo.Model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {

    // ดึงรายงาน/คำร้องขอที่เป็นเหตุฉุกเฉินหรือผิดปกติ เรียงจากใหม่ไปเก่า
    @Query("SELECT r FROM Report r WHERE r.is_normal = false ORDER BY r.report_time DESC")
    List<Report> findAbnormalReports();
}