package org.sgm_project.demo.Controller;

import org.sgm_project.demo.DTO.CreateGuardRequest;

import org.sgm_project.demo.Model.Guards;

import org.sgm_project.demo.Service.GuardService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guard")
@CrossOrigin(origins = "http://localhost:5173")
public class GuardController {

    private final GuardService guardService;

    public GuardController(
            GuardService guardService
    ) {
        this.guardService = guardService;
    }

    @PostMapping
    public ResponseEntity<Guards> createGuard(
            @RequestBody CreateGuardRequest request
    ) {

        Guards guard = guardService.createGuard(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(guard);
    }

    @GetMapping
    public ResponseEntity<List<Guards>> getAllGuards() {

        return ResponseEntity.ok(
                guardService.getAllGuards()
        );
    }

    @GetMapping("/active")
    public ResponseEntity<List<Guards>> getActiveGuards() {

        return ResponseEntity.ok(
                guardService.getActiveGuards()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Guards> getGuardById(
            @PathVariable Integer id
    ) {

        return ResponseEntity.ok(
                guardService.getGuardById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Guards> updateGuard(
            @PathVariable Integer id,
            @RequestBody Guards guard
    ) {

        return ResponseEntity.ok(
                guardService.updateGuard(id, guard)
        );
    }
}
