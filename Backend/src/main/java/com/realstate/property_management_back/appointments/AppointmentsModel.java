package com.realstate.property_management_back.appointments;

import com.realstate.property_management_back.auth.UserModel;
import com.realstate.property_management_back.properties.PropertiesModel;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter // Lombok generates getters/setters - encapsulation
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentsModel {

    public enum AppointmentStatus {
        pending,
        confirmed,
        rejected,
        cancel,
        completed
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;// private field - encapsulated

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserModel user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id")
    private PropertiesModel property;

    private LocalDate date;

    private LocalTime time;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status;

    //Column constraints
    @Column(name = "created_at", nullable = false, updatable = false)// Validation at DB level
    private LocalDateTime createdAt;

    @PrePersist
    //PrePersist validation - ensures createdAt is never null
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
