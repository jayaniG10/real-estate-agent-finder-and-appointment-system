package com.realstate.property_management_back.appointments;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository //Inheritance
public interface AppointmentsRepository extends JpaRepository<AppointmentsModel, Long> {
}
