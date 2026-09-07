package org.sgm_project.demo.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "assignment")
@Getter
@Setter
@NoArgsConstructor
public class Assignments {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer assignment_id;
    @Column(nullable = false)
    private String assignment_status;
    @Column
    private LocalDateTime request_date;
    @Column
    private String latitude;
    @Column
    private String longitude;
    @Column
    private String description;
    // 🌟 เพิ่ม 2 ก้อนนี้เข้าไป เพื่อจัดการ Foreign Key ตรงๆ
    @JsonIgnore // 🌟 เพิ่มบรรทัดนี้
    @ManyToOne
    @JoinColumn(name = "guard_id")
    private Guards guard;

    @JsonIgnore // 🌟 เพิ่มบรรทัดนี้
    @ManyToOne
    @JoinColumn(name = "shift_id")
    private ShiftTime shift;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "head_id")
    private HeadGuard headGuard;
}

//mostly from assigning work
//i need to explain how it works, cus it's hard to read the attributes
//first, guard needs to send their request to the shift first
//second, they will assign to the reserve status(this is why other attributes is null except status)
//third, headguards have right to choose whoever they need to become actual member and assign the work
