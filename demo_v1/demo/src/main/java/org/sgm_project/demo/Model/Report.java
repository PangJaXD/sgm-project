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

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shift_id", insertable = false, updatable = false)
    private ShiftTime shift;

    @Transient
    @com.fasterxml.jackson.annotation.JsonProperty("eventName")
    private String eventName;

    @com.fasterxml.jackson.annotation.JsonProperty("event_name")
    public String getEvent_name() {
        return eventName;
    }

    public void setEvent_name(String event_name) {
        this.eventName = event_name;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public ShiftTime getShift() {
        return shift;
    }

    public void setShift(ShiftTime shift) {
        this.shift = shift;
    }

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
