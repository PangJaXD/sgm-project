package org.sgm_project.demo.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class FileUploadController {

    private static final String BASE_UPLOAD_DIR = "uploads";

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "general") String folder
    ) {
        if (file.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "File is empty");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            // Sanitize folder name
            String safeFolder = folder.replaceAll("[^a-zA-Z0-9_-]", "");
            if (safeFolder.isEmpty()) {
                safeFolder = "general";
            }

            Path uploadPath = Paths.get(BASE_UPLOAD_DIR, safeFolder);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.jpg");
            // Keep safe characters in filename
            String cleanOriginalName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
            String uniqueFilename = UUID.randomUUID().toString() + "_" + cleanOriginalName;

            Path targetLocation = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Relative path suitable for storage in DB e.g. "reports/uuid_pic.jpg" or "events/uuid_pic.jpg"
            String relativeStoredPath = safeFolder + "/" + uniqueFilename;
            String publicUrl = "/uploads/" + relativeStoredPath;

            Map<String, Object> response = new HashMap<>();
            response.put("fileName", relativeStoredPath);
            response.put("fileUrl", publicUrl);
            response.put("originalName", originalFilename);
            response.put("size", file.getSize());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to store file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
