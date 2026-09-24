package org.sgm_project.demo.Repository;

import org.sgm_project.demo.Model.Assignments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignments, Integer> {
    @Query(value = "SELECT a.assignment_id, a.assignment_status, a.description, a.latitude, a.longitude, " +
            "g.users_id as guard_id, u.user_rank as rank, u.title, u.first_name, u.last_name, " +
            "TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) as guard_name, " +
            "COALESCE(CONCAT(DATE_FORMAT(s.start_time, '%H:%i'), ' - ', DATE_FORMAT(s.end_time, '%H:%i'), ' น.'), 'ไม่ระบุเวลา') as time_range "
            +
            "FROM assignment a " +
            "JOIN guards g ON a.guard_id = g.users_id " +
            "JOIN users u ON g.users_id = u.users_id " +
            "LEFT JOIN shift_time s ON a.shift_id = s.shift_id " +
            "WHERE a.shift_id = :shiftId", nativeQuery = true)
    List<Map<String, Object>> findAssignmentDetailsByShiftId(@Param("shiftId") Integer shiftId);

    @Query("SELECT COUNT(a) FROM Assignments a WHERE a.shift.shift_id = :shiftId")
    int countByShiftId(@Param("shiftId") Integer shiftId);

    @Query("SELECT a FROM Assignments a WHERE a.guard.users_id = :guardId")
    List<Assignments> findByGuardId(@Param("guardId") Integer guardId);

    @Query("SELECT a FROM Assignments a WHERE a.guard.users_id = :guardId AND a.shift.shift_id = :shiftId")
    Optional<Assignments> findByGuardIdAndShiftId(@Param("guardId") Integer guardId, @Param("shiftId") Integer shiftId);
}
