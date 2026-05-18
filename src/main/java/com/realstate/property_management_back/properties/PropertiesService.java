package com.realstate.property_management_back.properties;

import com.realstate.property_management_back.auth.UserModel;
import com.realstate.property_management_back.auth.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PropertiesService {

    @Autowired
    private PropertiesRepository propertiesRepository;

    @Autowired
    private UserRepository userRepository;

    public List<PropertiesDto> getAllProperties() {
        return propertiesRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public PropertiesDto getPropertyById(Long id) {
        PropertiesModel property = propertiesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        return convertToDto(property);
    }

    public PropertiesDto createProperty(PropertiesDto propertiesDto) {
        PropertiesModel property = convertToEntity(propertiesDto);
        PropertiesModel savedProperty = propertiesRepository.save(property);
        return convertToDto(savedProperty);
    }

    public PropertiesDto updateProperty(Long id, PropertiesDto propertiesDto) {
        PropertiesModel existingProperty = propertiesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        existingProperty.setTitle(propertiesDto.getTitle());
        existingProperty.setPrice(propertiesDto.getPrice());
        existingProperty.setLocation(propertiesDto.getLocation());
        existingProperty.setDescription(propertiesDto.getDescription());
        existingProperty.setImage(propertiesDto.getImage());
        existingProperty.setStatus(propertiesDto.getStatus());

        if (propertiesDto.getAddedBy() != null) {
            UserModel user = userRepository.findById(propertiesDto.getAddedBy())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            existingProperty.setAddedBy(user);
        }

        PropertiesModel updatedProperty = propertiesRepository.save(existingProperty);
        return convertToDto(updatedProperty);
    }

    public void deleteProperty(Long id) {
        propertiesRepository.deleteById(id);
    }

    private PropertiesDto convertToDto(PropertiesModel property) {
        PropertiesDto dto = new PropertiesDto();
        dto.setId(property.getId());
        dto.setTitle(property.getTitle());
        dto.setPrice(property.getPrice());
        dto.setLocation(property.getLocation());
        dto.setDescription(property.getDescription());
        dto.setImage(property.getImage());
        dto.setStatus(property.getStatus());
        dto.setCreatedAt(property.getCreatedAt());
        if (property.getAddedBy() != null) {
            dto.setAddedBy(property.getAddedBy().getId());
        }
        return dto;
    }

    private PropertiesModel convertToEntity(PropertiesDto dto) {
        PropertiesModel entity = new PropertiesModel();
        entity.setId(dto.getId());
        entity.setTitle(dto.getTitle());
        entity.setPrice(dto.getPrice());
        entity.setLocation(dto.getLocation());
        entity.setDescription(dto.getDescription());
        entity.setImage(dto.getImage());
        entity.setStatus(dto.getStatus());

        if (dto.getAddedBy() != null) {
            UserModel user = userRepository.findById(dto.getAddedBy())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            entity.setAddedBy(user);
        }
        return entity;
    }
}
