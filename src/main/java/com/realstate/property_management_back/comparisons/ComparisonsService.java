package com.realstate.property_management_back.comparisons;

import com.realstate.property_management_back.auth.UserRepository;
import com.realstate.property_management_back.properties.PropertiesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComparisonsService {

    private final ComparisonsRepository comparisonsRepository;
    private final UserRepository userRepository;
    private final PropertiesRepository propertiesRepository;

    public List<ComparisonsDto> getAllComparisons() {
        return comparisonsRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<ComparisonsDto> getComparisonsByUserId(Long userId) {
        return comparisonsRepository.findAll().stream()
                .filter(c -> c.getUser().getId().equals(userId))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public ComparisonsDto addComparison(ComparisonsDto comparisonsDto) {
        ComparisonsModel comparison = new ComparisonsModel();
        comparison.setUser(userRepository.findById(comparisonsDto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found")));
        comparison.setProperty(propertiesRepository.findById(comparisonsDto.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found")));
        
        return convertToDto(comparisonsRepository.save(comparison));
    }

    public void deleteComparison(Long id) {
        comparisonsRepository.deleteById(id);
    }

    private ComparisonsDto convertToDto(ComparisonsModel comparison) {
        ComparisonsDto dto = new ComparisonsDto();
        dto.setId(comparison.getId());
        dto.setUserId(comparison.getUser().getId());
        dto.setPropertyId(comparison.getProperty().getId());
        dto.setCreatedAt(comparison.getCreatedAt());
        return dto;
    }
}
