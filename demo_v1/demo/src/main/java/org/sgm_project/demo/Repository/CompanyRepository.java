package org.sgm_project.demo.Repository;

import org.sgm_project.demo.Model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
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

    @Query("""
                SELECT COUNT(c) > 0
                FROM Company c
                WHERE c.username = :username AND c.users_id != :id
            """)
    boolean existsByUsernameAndIdNot(@Param("username") String username, @Param("id") Integer id);

    @Query("""
                SELECT c FROM Company c
                WHERE (:adminName IS NOT NULL AND (
                        LOWER(TRIM(c.admin_name)) = LOWER(TRIM(:adminName))
                     OR LOWER(TRIM(c.admin_name)) LIKE LOWER(CONCAT('%', TRIM(:adminName), '%'))
                ))
                OR (:adminUsername IS NOT NULL AND (
                        LOWER(TRIM(c.admin_name)) = LOWER(TRIM(:adminUsername))
                     OR LOWER(TRIM(c.admin_name)) LIKE LOWER(CONCAT('%', TRIM(:adminUsername), '%'))
                ))
            """)
    List<Company> findByAdmin(@Param("adminName") String adminName, @Param("adminUsername") String adminUsername);
}