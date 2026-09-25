package org.sgm_project.demo.Repository;

import org.sgm_project.demo.Model.Events;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Events, Integer> {

    // ดึงข้อมูลทั้งหมดพร้อมกับ tools และ shift_times แบบ Eager เพื่อป้องกัน N+1
    @EntityGraph(attributePaths = { "required_tools", "provided_tools", "shift_times" })
    List<Events> findAll();

    @EntityGraph(attributePaths = { "required_tools", "provided_tools", "shift_times" })
    Optional<Events> findById(Integer id);

    @Query("SELECT DISTINCT e FROM Events e JOIN e.shift_times st WHERE st.headGuard.users_id = :headId")
    List<Events> findEventsByShiftHeadGuardId(@Param("headId") Integer headId);

    @EntityGraph(attributePaths = { "required_tools", "provided_tools", "shift_times" })
    @Query("SELECT DISTINCT e FROM Events e LEFT JOIN e.shift_times st LEFT JOIN st.headGuard hg WHERE e.company_id = :companyId OR hg.company_name = (SELECT c.company_name FROM Company c WHERE c.users_id = :companyId) OR hg.company_name = (SELECT u.username FROM Users u WHERE u.users_id = :companyId)")
    List<Events> findByCompanyId(@Param("companyId") Integer companyId);

    @EntityGraph(attributePaths = { "required_tools", "provided_tools", "shift_times" })
    @Query("SELECT DISTINCT e FROM Events e LEFT JOIN e.shift_times st LEFT JOIN st.headGuard hg WHERE hg.company_name = :companyName")
    List<Events> findEventsByCompanyName(@Param("companyName") String companyName);

    @EntityGraph(attributePaths = { "required_tools", "provided_tools", "shift_times" })
    @Query("SELECT DISTINCT e FROM Events e JOIN e.shift_times st WHERE CONCAT(st.headGuard.first_name, ' ', st.headGuard.last_name) = :headName OR st.headGuard.username = :headName")
    List<Events> findEventsByHeadName(@Param("headName") String headName);

    @EntityGraph(attributePaths = { "required_tools", "provided_tools", "shift_times" })
    @Query("SELECT DISTINCT e FROM Events e JOIN e.shift_times st WHERE CONCAT(st.headGuard.first_name, ' ', st.headGuard.last_name) = (SELECT g.head_name FROM Guards g WHERE g.users_id = :guardId)")
    List<Events> findEventsByGuardId(@Param("guardId") Integer guardId);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Events e SET e.company_id = NULL WHERE e.company_id = :companyId")
    void clearCompanyIdFromEvents(@Param("companyId") Integer companyId);
}