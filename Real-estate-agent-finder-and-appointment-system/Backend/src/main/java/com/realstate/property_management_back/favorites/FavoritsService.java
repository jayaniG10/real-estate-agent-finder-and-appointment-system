package com.realstate.property_management_back.favorites;

import com.realstate.property_management_back.auth.UserModel;
import com.realstate.property_management_back.auth.UserRepository;
import com.realstate.property_management_back.properties.PropertiesModel;
import com.realstate.property_management_back.properties.PropertiesRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class FavoritsService {

    @Autowired
    private FavoritsRepository favoritsRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PropertiesRepository propertiesRepository;

    public List<FavoritsDto> getAllFavorites() {
        return favoritsRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public FavoritsDto getFavoriteById(Long id) {
        FavoritsModel favorite = favoritsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Favorite not found"));
        return convertToDto(favorite);
    }

    public FavoritsDto createFavorite(FavoritsDto favoritsDto) {
        FavoritsModel favorite = convertToEntity(favoritsDto);
        FavoritsModel savedFavorite = favoritsRepository.save(favorite);
        return convertToDto(savedFavorite);
    }

    public FavoritsDto updateFavorite(Long id, FavoritsDto favoritsDto) {
        FavoritsModel existingFavorite = favoritsRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Favorite not found"));
        
        existingFavorite.setNotes(favoritsDto.getNotes());
        
        if (favoritsDto.getUserId() != null) {
            UserModel user = userRepository.findById(favoritsDto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            existingFavorite.setUser(user);
        }

        if (favoritsDto.getPropertyId() != null) {
            PropertiesModel property = propertiesRepository.findById(favoritsDto.getPropertyId())
                    .orElseThrow(() -> new RuntimeException("Property not found"));
            existingFavorite.setProperty(property);
        }

        FavoritsModel updatedFavorite = favoritsRepository.save(existingFavorite);
        return convertToDto(updatedFavorite);
    }

    public void deleteFavorite(Long id) {
        favoritsRepository.deleteById(id);
    }

    private FavoritsDto convertToDto(FavoritsModel favorite) {
        FavoritsDto dto = new FavoritsDto();
        dto.setId(favorite.getId());
        dto.setNotes(favorite.getNotes());
        dto.setCreatedAt(favorite.getCreatedAt());
        if (favorite.getUser() != null) {
            dto.setUserId(favorite.getUser().getId());
        }
        if (favorite.getProperty() != null) {
            dto.setPropertyId(favorite.getProperty().getId());
        }
        return dto;
    }

    private FavoritsModel convertToEntity(FavoritsDto dto) {
        FavoritsModel entity = new FavoritsModel();
        entity.setId(dto.getId());
        entity.setNotes(dto.getNotes());
        
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
