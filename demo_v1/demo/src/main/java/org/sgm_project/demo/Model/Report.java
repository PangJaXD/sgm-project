package org.sgm_project.demo.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "report")
@Getter
@Setter
@NoArgsConstructor
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer report_id;
    @Column(nullable = false)
    private boolean is_normal;
    @Column(nullable = false)
    private String report_type;
    @Column(nullable = false)
    private LocalDateTime report_time;
    @Column(nullable = false)
    private String report_img;
    @Column(length = 255, nullable = false)
    private String report_desc;
}

//report
