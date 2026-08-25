package org.sgm_project.demo.Repository;

import org.sgm_project.demo.Model.ShiftTime;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShiftTimeRepository extends JpaRepository<ShiftTime, Integer> {
}
