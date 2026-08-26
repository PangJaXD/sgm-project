package org.sgm_project.demo.Repository;

import org.sgm_project.demo.Model.Assignments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface AssignmentRepository  extends JpaRepository<Assignments, Integer> {
    @Query(value = "SELECT a.assignment_id, a.assignment_status, a.description, a.latitude, a.longitude, " +
            "g.users_id as guard_id, u.first_name, u.last_name as guard_name " +
            "FROM assignment a " +
            "JOIN guards g ON a.guard_id = g.users_id " +
            "JOIN users u ON g.users_id = u.users_id " +
            "WHERE a.shift_id = :shiftId", nativeQuery = true)
    List<Map<String, Object>> findAssignmentDetailsByShiftId(@Param("shiftId") Integer shiftId);
    @Query("SELECT COUNT(a) FROM Assignments a WHERE a.shift.shift_id = :shiftId")
    int countByShiftId(@Param("shiftId") Integer shiftId);
}

//i did not check this code but in my prediction it has to do something on the frontend side
//so im gonna talk about object
//it is useful when u use custom query
//because YOU DIDN'T SEND WHOLE CLASS FROM ITS

