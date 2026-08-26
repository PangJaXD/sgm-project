package org.sgm_project.demo.Repository;

import org.sgm_project.demo.Model.ShiftTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ShiftTimeRepository extends JpaRepository<ShiftTime, Integer> {
    @Query("SELECT s FROM ShiftTime s WHERE s.headGuard.users_id = :headGuardId ORDER BY s.shift_date ASC")
    List<ShiftTime> findByHeadGuardId(@Param("headGuardId") Integer headGuardId);
}
