package org.sgm_project.demo.Controller;

import org.sgm_project.demo.Exception.DuplicateUsernameException;
import org.sgm_project.demo.Exception.ResourceNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Not Found (404)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFound(ResourceNotFoundException ex) {
        System.err.println(">>> [GlobalExceptionHandler] ResourceNotFound: " + ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", ex.getMessage() != null ? ex.getMessage() : "ไม่พบข้อมูลในระบบ"));
    }

    // 2. Duplicate Username (409)
    @ExceptionHandler(DuplicateUsernameException.class)
    public ResponseEntity<Map<String, String>> handleDuplicateUsername(DuplicateUsernameException ex) {
        System.err.println(">>> [GlobalExceptionHandler] DuplicateUsername: " + ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of("message", ex.getMessage()));
    }

    // 3. Database Constraint / Integrity Violation (409)
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        System.err.println(">>> [GlobalExceptionHandler] DataIntegrityViolation: " + ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of("message", "ข้อมูลซ้ำซ้อนหรือติดเงื่อนไขความสัมพันธ์ในฐานข้อมูล"));
    }

    // 4. Request Validation Errors (400)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );
        System.err.println(">>> [GlobalExceptionHandler] Validation Failed: " + fieldErrors);
        Map<String, Object> body = new HashMap<>();
        body.put("message", "ข้อมูลที่ส่งมาไม่ถูกต้องตามเงื่อนไข");
        body.put("errors", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // 5. Malformed JSON / Not Readable (400)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        System.err.println(">>> [GlobalExceptionHandler] Malformed JSON: " + ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "รูปแบบข้อมูล JSON ที่ส่งมาไม่ถูกต้อง"));
    }

    // 6. Illegal Argument (400)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        System.err.println(">>> [GlobalExceptionHandler] IllegalArgument: " + ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", ex.getMessage() != null ? ex.getMessage() : "พารามิเตอร์ไม่ถูกต้อง"));
    }

    // 7. Method Not Allowed (405)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, String>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        System.err.println(">>> [GlobalExceptionHandler] MethodNotSupported: " + ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(Map.of("message", "HTTP Method ไม่รองรับ: " + ex.getMethod()));
    }

    // 8. Runtime Exceptions (Categorized: Auth vs General Business Logic)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        System.err.println(">>> [GlobalExceptionHandler] RuntimeException: " + ex.getMessage());
        String msg = ex.getMessage() != null ? ex.getMessage() : "";

        // Check if authentication failure
        if (msg.contains("รหัสผ่าน") || msg.toLowerCase().contains("login") || msg.toLowerCase().contains("unauthorized") || msg.toLowerCase().contains("credentials")) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", msg.isEmpty() ? "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" : msg));
        }

        // Check if not found keywords
        if (msg.contains("ไม่พบ") || msg.toLowerCase().contains("not found")) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", msg));
        }

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", msg.isEmpty() ? "คำขอไม่ถูกต้อง" : msg));
    }

    // 9. Generic Internal Server Error (500)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception ex) {
        System.err.println(">>> [GlobalExceptionHandler] Internal Server Error: " + ex.getMessage());
        ex.printStackTrace();
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง"));
    }
}