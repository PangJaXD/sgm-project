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

    @Column(name = "guard_id")
    private Integer guard_id;

    @Column(name = "shift_id")
    private Integer shift_id;

    public Integer getGuard_id() {
        return guard_id;
    }

    public void setGuard_id(Integer guard_id) {
        this.guard_id = guard_id;
    }

    public Integer getShift_id() {
        return shift_id;
    }

    public void setShift_id(Integer shift_id) {
        this.shift_id = shift_id;
    }
}
