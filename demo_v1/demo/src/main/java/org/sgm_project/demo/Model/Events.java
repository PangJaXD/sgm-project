package org.sgm_project.demo.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
public class Events {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer event_id;
    @Column(length = 150, nullable = false)
    private String event_name;
    @Column(length = 255, nullable = false)
    private String location;
    @Column(nullable = false)
    private String latitude;
    @Column(nullable = false)
    private String longitude;
    @Column(length = 150, nullable = false)
    private String contractor;
    @Column(nullable = false)
    private String contact;
    @Column(nullable = false)
    private String event_img;
    @Column(length = 255, nullable = false)
    private String event_detail;
    @Column
    private LocalDate start_date;
    @Column
    private LocalDate end_date;
    @Column
    private String status;
    @ElementCollection
    @CollectionTable(
            name = "events_required_tools",
            joinColumns = @JoinColumn(name = "event_id")
    )
    private Set<String> required_tools;
    @ElementCollection
    @CollectionTable(
            name = "events_provided_tools",
            joinColumns = @JoinColumn(name = "event_id")
    )
    private Set<String> provided_tools;
    @Column(nullable = false)
    private Integer required_guards;
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "event_id")
    private Set<ShiftTime> shift_times;
}
