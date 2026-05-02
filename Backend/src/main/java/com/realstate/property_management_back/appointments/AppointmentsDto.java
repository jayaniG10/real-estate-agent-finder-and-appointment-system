package com.realstate.property_management_back.appointments;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data// Lombok encapsulates fields with getters/setters
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentsDto {
    private Long id;
    private Long userId;
    private Long propertyId;
    private LocalDate date;
    private LocalTime time;
    private AppointmentsModel.AppointmentStatus status;// Enum restricts to: pending, confirmed, cancel, completed
    private LocalDateTime createdAt;
}
