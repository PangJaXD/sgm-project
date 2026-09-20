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

    @Query("""
            SELECT g FROM Guards g
            WHERE (:company IS NULL OR :company = ''
                   OR g.company_name = :company
                   OR g.company_name IN (SELECT c.company_name FROM Company c WHERE c.username = :company OR c.company_name = :company)
                   OR g.company_name IN (SELECT c.username FROM Company c WHERE c.username = :company OR c.company_name = :company))
            """)
    List<Guards> findByCompanyIdentifier(@Param("company") String company);
}