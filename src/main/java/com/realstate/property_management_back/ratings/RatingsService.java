package com.realstate.property_management_back.ratings;

import com.realstate.property_management_back.auth.UserModel;
import com.realstate.property_management_back.auth.UserRepository;
import com.realstate.property_management_back.properties.PropertiesModel;
import com.realstate.property_management_back.properties.PropertiesRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RatingsService {

    @Autowired
    private RatingsRepository ratingsRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertiesRepository propertiesRepository;

    public List<RatingsDto> getAllRatings() {
        return ratingsRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public RatingsDto getRatingById(Long id) {
        RatingsModel rating = ratingsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rating not found"));
        return convertToDto(rating);
    }

    public RatingsDto createRating(RatingsDto ratingsDto) {
        RatingsModel rating = convertToEntity(ratingsDto);
        RatingsModel savedRating = ratingsRepository.save(rating);
        return convertToDto(savedRating);
    }

    public RatingsDto updateRating(Long id, RatingsDto ratingsDto) {
        RatingsModel existingRating = ratingsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rating not found"));
        
        existingRating.setRating(ratingsDto.getRating());
        existingRating.setComment(ratingsDto.getComment());
        
        if (ratingsDto.getUserId() != null) {
            UserModel user = userRepository.findById(ratingsDto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            existingRating.setUser(user);
        }

        if (ratingsDto.getPropertyId() != null) {
            PropertiesModel property = propertiesRepository.findById(ratingsDto.getPropertyId())
                    .orElseThrow(() -> new RuntimeException("Property not found"));
            existingRating.setProperty(property);
        }

        RatingsModel updatedRating = ratingsRepository.save(existingRating);
        return convertToDto(updatedRating);
    }

    public void deleteRating(Long id) {
        ratingsRepository.deleteById(id);
    }

    private RatingsDto convertToDto(RatingsModel rating) {
        RatingsDto dto = new RatingsDto();
        dto.setId(rating.getId());
        dto.setRating(rating.getRating());
        dto.setComment(rating.getComment());
        dto.setCreatedAt(rating.getCreatedAt());
        if (rating.getUser() != null) {
            dto.setUserId(rating.getUser().getId());
        }
        if (rating.getProperty() != null) {
            dto.setPropertyId(rating.getProperty().getId());
        }
        return dto;
    }

    private RatingsModel convertToEntity(RatingsDto dto) {
        RatingsModel entity = new RatingsModel();
        entity.setId(dto.getId());
        entity.setRating(dto.getRating());
        entity.setComment(dto.getComment());
        
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
