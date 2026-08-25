package org.sgm_project.demo.Model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Entity
@Table(name = "guards")
@Getter
@Setter
@NoArgsConstructor
public class Guards extends Staff{
    @OneToMany(mappedBy = "guard", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assignments> assignments;
    @OneToMany
    @JoinColumn(name = "guard_id")
    private List<Report> reports;
    @Column
    private String company_name;
    @Column
    private String head_name;
}
