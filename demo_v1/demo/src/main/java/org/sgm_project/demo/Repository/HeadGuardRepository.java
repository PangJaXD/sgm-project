package org.sgm_project.demo.Repository;

import org.sgm_project.demo.Model.HeadGuard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HeadGuardRepository extends JpaRepository<HeadGuard, Integer> {

        Optional<HeadGuard> findByUsername(String username);

        @Query("""
                        SELECT h
                        FROM HeadGuard h
                        WHERE h.quit_date IS NULL
                        """)
        List<HeadGuard> findActiveHeadGuards();

        @Query("""
                        SELECT h FROM HeadGuard h
                        WHERE (:company IS NULL OR :company = ''
                               OR h.company_name = :company
                               OR h.company_name IN (SELECT c.company_name FROM Company c WHERE c.username = :company OR c.company_name = :company)
                               OR h.company_name IN (SELECT c.username FROM Company c WHERE c.username = :company OR c.company_name = :company))
                        """)
        List<HeadGuard> findByCompanyIdentifier(@Param("company") String company);
}