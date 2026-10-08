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
    @Column(name = "end_time")
    private LocalDateTime end_time;
    @Column(nullable = false)
    private Integer maximum_guards;

    @PrePersist
    @PreUpdate
    public void syncEndTime() {
        if (start_time != null && duration != null) {
            this.end_time = start_time.plusHours(duration);
        }
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
        if (this.start_time != null && duration != null) {
            this.end_time = this.start_time.plusHours(duration);
        }
    }

    public void setStart_time(LocalDateTime startTime) {
        this.start_time = startTime;
        if (startTime != null && this.duration != null) {
            this.end_time = startTime.plusHours(this.duration);
        }
    }

    @com.fasterxml.jackson.annotation.JsonProperty("end_time")
    public LocalDateTime getEnd_time() {
        if (end_time != null) {
            return end_time;
        }
        if (start_time != null && duration != null) {
            return start_time.plusHours(duration);
        }
        return null;
    }

    public void setEnd_time(LocalDateTime endTime) {
        this.end_time = endTime;
        if (endTime != null && this.start_time != null) {
            this.duration = (int) java.time.Duration.between(this.start_time, endTime).toHours();
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
