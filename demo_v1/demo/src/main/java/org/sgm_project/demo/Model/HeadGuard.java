package org.sgm_project.demo.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "head_guard")
@Getter
@Setter
@NoArgsConstructor
public class HeadGuard extends Staff{
    @OneToMany
    @JoinColumn(name = "head_id")
    private List<Assignments> assignments;
//    @OneToMany(cascade = CascadeType.ALL, mappedBy = "head_guard", orphanRemoval = true)
//    private List<ShiftTime> shiftTimes;
    @Column
    private String company_name;
}
