package org.sgm_project.demo.Controller;

import org.sgm_project.demo.Model.Admin;
import org.sgm_project.demo.Service.AdminService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping
    public ResponseEntity<Admin> createAdmin(@RequestBody Admin admin) {

        Admin newAdmin = adminService.createAdmin(admin);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(newAdmin);
    }
}