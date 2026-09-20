package org.sgm_project.demo.Model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonProperty("company_id")
    @Column(name = "company_id")
    private Integer company_id;
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, mappedBy = "event")
    private Set<ShiftTime> shift_times;
}

//this annotation is crazy btw
//i know u see some of these before
//but wtf is @ElementCollection
//this is useful when you make some table that has to join itself
/*
this is a great example
    @ElementCollection
    @CollectionTable(
            name = "events_required_tools",
            joinColumns = @JoinColumn(name = "event_id")
    )
cus it is required tool it belongs to the event and event needs many tools
ElementCollection is for list
CollectionTable is for making a table that support the attribute
 */
