package org.sgm_project.demo.Repository;

import org.sgm_project.demo.Model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, Integer> {

    // ดึงรายงาน/คำร้องขอที่เป็นเหตุฉุกเฉินหรือผิดปกติ เรียงจากใหม่ไปเก่า
    @Query("SELECT r FROM Report r LEFT JOIN FETCH r.shift st LEFT JOIN FETCH st.event e WHERE r.is_normal = false ORDER BY r.report_time DESC")
    List<Report> findAbnormalReports();

    // ดึงรายงานฉุกเฉินเฉพาะที่มาจากกะที่ระบุ (ตรงตาม shift_id ของ HeadGuard)
    @Query("SELECT r FROM Report r WHERE r.shift_id IN :shiftIds AND r.is_normal = false ORDER BY r.report_time DESC")
    List<Report> findAbnormalReportsByShiftIds(@Param("shiftIds") List<Integer> shiftIds);

    @Query("SELECT r FROM Report r WHERE r.guard_id = :guardId ORDER BY r.report_time DESC")
    List<Report> findByGuardId(@Param("guardId") Integer guardId);
}