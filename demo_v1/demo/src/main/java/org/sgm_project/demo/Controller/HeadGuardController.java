package org.sgm_project.demo.Controller;

import org.sgm_project.demo.DTO.CreateHeadGuardRequest;
import org.sgm_project.demo.DTO.HeadGuardResponse;
import org.sgm_project.demo.Model.HeadGuard;
import org.sgm_project.demo.Service.HeadGuardService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/headguard")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class HeadGuardController {

    private final HeadGuardService headGuardService;

    public HeadGuardController(
            HeadGuardService headGuardService
    ) {
        this.headGuardService = headGuardService;
    }

    @PostMapping
    public ResponseEntity<HeadGuard> createHeadGuard(
            @RequestBody CreateHeadGuardRequest request
    ) {

        HeadGuard headGuard =
                headGuardService.createHeadGuard(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(headGuard);
    }

    @GetMapping
    public ResponseEntity<List<HeadGuardResponse>> getAllHeadGuards() {
        return ResponseEntity.ok(
                headGuardService.getAllHeadGuardsResponse()
        );
    }

    @GetMapping("/active")
    public ResponseEntity<List<HeadGuard>> getActiveHeadGuards() {

        return ResponseEntity.ok(
                headGuardService.getActiveHeadGuards()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<HeadGuard> getHeadGuardById(
            @PathVariable Integer id
    ) {

        return ResponseEntity.ok(
                headGuardService.getHeadGuardById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<HeadGuard> updateHeadGuard(
            @PathVariable Integer id,
            @RequestBody HeadGuard headGuard
    ) {

        return ResponseEntity.ok(
                headGuardService.updateHeadGuard(id, headGuard)
        );
    }
}

//same concept as another controller