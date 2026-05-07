package com.realstate.property_management_back.appointments;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentsController {

    @Autowired
    private AppointmentsService appointmentsService;

    // CREATE (POST)
    @PostMapping
    public AppointmentsDto createAppointment(@RequestBody AppointmentsDto appointmentsDto) {
        return appointmentsService.createAppointment(appointmentsDto);
    }

    // UPDATE (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<AppointmentsDto> updateAppointment(@PathVariable Long id, @RequestBody AppointmentsDto appointmentsDto) {
        return ResponseEntity.ok(appointmentsService.updateAppointment(id, appointmentsDto));
    }
}