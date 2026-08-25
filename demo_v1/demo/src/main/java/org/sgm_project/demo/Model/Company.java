package org.sgm_project.demo.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "company")
@Getter
@Setter
@NoArgsConstructor
public class Company extends Users{
    @Column(length = 150, nullable = false)
    private String company_name;
    @OneToMany
    @JoinColumn(name = "company_id")
    private List<Events> events;
    @Column
    private String admin_name;
}
