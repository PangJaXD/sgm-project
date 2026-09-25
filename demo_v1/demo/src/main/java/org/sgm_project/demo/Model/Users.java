package org.sgm_project.demo.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@Inheritance(strategy = InheritanceType.JOINED)
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer users_id;
    @Column(name = "user_rank")
    private String rank;
    @Column
    private String title;
    @Column
    private String first_name;
    @Column
    private String last_name;
    @Column
    private String gender;
    @Column(length = 10, nullable = false)
    private String phone;
    @Column(length = 255, nullable = false)
    private String address;
    @Column(length = 255, nullable = false)
    private String user_detail;
    @Column(nullable = false)
    private LocalDateTime start_date;
    @Column
    private LocalDateTime quit_date;
    @Column(name = "status")
    private String status;
    @Column(nullable = false)
    private String profile_img;
    @Column(length = 50, nullable = false, unique = true)
    private String username;
    @Column(nullable = false)
    private String password;
}

// users
