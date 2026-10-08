package org.sgm_project.demo.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    private Integer duration;
    @Column(nullable = false)
    private Integer maximum_guards;

    @com.fasterxml.jackson.annotation.JsonProperty("end_time")
    public LocalDateTime getEnd_time() {
        if (start_time != null && duration != null) {
            return start_time.plusHours(duration);
        }
        return null;
    }

    public void setEnd_time(LocalDateTime endTime) {
        if (endTime != null && start_time != null) {
            this.duration = (int) java.time.Duration.between(start_time, endTime).toHours();
        }
    }
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
