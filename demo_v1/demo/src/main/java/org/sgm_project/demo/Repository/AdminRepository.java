package org.sgm_project.demo.Repository;

import org.sgm_project.demo.Model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Integer> {
    Optional<Admin> findByUsername(String username);
}

//why is it optional
//when you see this function gets call on the service they gonna send
//two possible value Admin or null
//cause if u send pure class from the repository and got null value
//they gonna break your code