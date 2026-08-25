package org.sgm_project.demo.Repository;

import org.sgm_project.demo.Model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Integer> {

    Optional<Company> findByUsername(String username);
    @Query("""
        SELECT COUNT(c) > 0
        FROM Company c
        WHERE c.username = :username
    """)
    boolean existsByUsernameCustom(@Param("username") String username);
}