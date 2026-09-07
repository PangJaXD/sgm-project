package org.sgm_project.demo.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @JsonIgnore
    @OneToMany(mappedBy = "headGuard")
    private List<Assignments> assignments;
    @JsonIgnore
    @OneToMany(cascade = CascadeType.ALL, mappedBy = "headGuard", orphanRemoval = true)
    private List<ShiftTime> shiftTimes;
    @Column
    private String company_name;
}

//headguard
