package com.realstate.property_management_back.appointments;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentsController {

    @Autowired
    private AppointmentsService appointmentsService;

    // READ (GET all)
    @GetMapping
    public List<AppointmentsDto> getAllAppointments() {
        return appointmentsService.getAllAppointments();
    }

    // READ (GET by ID)
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentsDto> getAppointmentById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentsService.getAppointmentById(id));
    }

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

    // DELETE (DELETE)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentsService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }
}
