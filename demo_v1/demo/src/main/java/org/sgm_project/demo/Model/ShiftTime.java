package org.sgm_project.demo.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.query.assignment.Assignment;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "shift_time")
@Getter
@Setter
@NoArgsConstructor
public class ShiftTime {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer shift_id;
    @Column(nullable = false)
    private LocalDateTime shift_date;
    @Column(nullable = false)
    private LocalDateTime start_time;
    @Column(nullable = false)
    private LocalDateTime end_time;
    @Column(nullable = false)
    private Integer maximum_guards;
    @OneToMany
    @JoinColumn(name = "shift_id")
    private List<Report> reports;
    @JsonIgnore
    @OneToMany(mappedBy = "shift", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Assignments> assignment;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "head_guard_id")
    private HeadGuard headGuard;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Events event;
}

//shifttime
