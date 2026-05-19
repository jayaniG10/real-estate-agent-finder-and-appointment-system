package com.realstate.property_management_back.appointments;

import com.realstate.property_management_back.auth.UserModel;
import com.realstate.property_management_back.auth.UserRepository;
import com.realstate.property_management_back.properties.PropertiesModel;
import com.realstate.property_management_back.properties.PropertiesRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AppointmentsService {

    @Autowired
    private AppointmentsRepository appointmentsRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertiesRepository propertiesRepository;

    public List<AppointmentsDto> getAllAppointments() {
       //getAllAppointments - polymorphism through Stream API
        return appointmentsRepository.findAll().stream()
                .map(this::convertToDto)// Method  - polymorphic behavior
                .collect(Collectors.toList());
    }

    public AppointmentsDto getAppointmentById(Long id) {
        AppointmentsModel appointment = appointmentsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        return convertToDto(appointment);
    }

    public AppointmentsDto createAppointment(AppointmentsDto appointmentsDto) {
        AppointmentsModel appointment = convertToEntity(appointmentsDto);
        AppointmentsModel savedAppointment = appointmentsRepository.save(appointment);
        return convertToDto(savedAppointment);
    }

    public AppointmentsDto updateAppointment(Long id, AppointmentsDto appointmentsDto) {
        AppointmentsModel existingAppointment = appointmentsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        existingAppointment.setDate(appointmentsDto.getDate());
        existingAppointment.setTime(appointmentsDto.getTime());
        existingAppointment.setStatus(appointmentsDto.getStatus());
        
        if (appointmentsDto.getUserId() != null) {
            UserModel user = userRepository.findById(appointmentsDto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            existingAppointment.setUser(user);
        }

        if (appointmentsDto.getPropertyId() != null) {
            PropertiesModel property = propertiesRepository.findById(appointmentsDto.getPropertyId())
                    .orElseThrow(() -> new RuntimeException("Property not found"));
            existingAppointment.setProperty(property);
        }

        AppointmentsModel updatedAppointment = appointmentsRepository.save(existingAppointment);
        return convertToDto(updatedAppointment);
    }

    public void deleteAppointment(Long id) {
        appointmentsRepository.deleteById(id);
    }

    private AppointmentsDto convertToDto(AppointmentsModel appointment) {
        AppointmentsDto dto = new AppointmentsDto();
        dto.setId(appointment.getId());
        dto.setDate(appointment.getDate());
        dto.setTime(appointment.getTime());
        dto.setStatus(appointment.getStatus());
        dto.setCreatedAt(appointment.getCreatedAt());
        if (appointment.getUser() != null) {
            dto.setUserId(appointment.getUser().getId());
        }
        if (appointment.getProperty() != null) {
            dto.setPropertyId(appointment.getProperty().getId());
        }
        return dto;
    }

    private AppointmentsModel convertToEntity(AppointmentsDto dto) {
        AppointmentsModel entity = new AppointmentsModel();
        entity.setId(dto.getId());
        entity.setDate(dto.getDate());
        entity.setTime(dto.getTime());
        entity.setStatus(dto.getStatus());
        
        if (dto.getUserId() != null) {
            UserModel user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            entity.setUser(user);
        }

        if (dto.getPropertyId() != null) {
            PropertiesModel property = propertiesRepository.findById(dto.getPropertyId())
                    .orElseThrow(() -> new RuntimeException("Property not found"));
            entity.setProperty(property);
        }
        return entity;
    }
}
