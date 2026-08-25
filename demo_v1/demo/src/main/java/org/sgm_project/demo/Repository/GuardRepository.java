package org.sgm_project.demo.Repository;

import org.sgm_project.demo.Model.Guards;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GuardRepository extends JpaRepository<Guards, Integer> {
    @Query("""
        SELECT g
        FROM Guards g
        WHERE g.quit_date IS NULL
        """)
    List<Guards> findActiveGuards();
    // ดึง รปภ. ที่อยู่ภายใต้ Head Guard คนนี้
    @Query("SELECT g FROM Guards g WHERE g.head_name = :headName")
    List<Guards> findGuardsByHeadName(@Param("headName") String headName);
}