package com.sgm_api.api_v1.Model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password; // รหัสผ่านที่เก็บควรเป็นแบบเข้ารหัส (BCrypt)

    // Getter และ Setter (หรือใช้ @Data ของ Lombok ก็ได้)
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}