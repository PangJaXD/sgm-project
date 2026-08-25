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
    @EntityGraph(attributePaths = {"required_tools", "provided_tools", "shift_times"})
    List<Events> findAll();

    @EntityGraph(attributePaths = {"required_tools", "provided_tools", "shift_times"})
    Optional<Events> findById(Integer id);

    @Query("SELECT DISTINCT e FROM Events e JOIN e.shift_times st WHERE st.head_guard_id = :headId")
    List<Events> findEventsByShiftHeadGuardId(@Param("headId") Integer headId);
}