package com.realstate.property_management_back.inquiries;

import com.realstate.property_management_back.auth.UserRepository;
import com.realstate.property_management_back.properties.PropertiesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InquiriesService {

    private final InquiriesRepository inquiriesRepository;
    private final UserRepository userRepository;
    private final PropertiesRepository propertiesRepository;

    public List<InquiriesDto> getAllInquiries() {
        return inquiriesRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public InquiriesDto getInquiryById(Long id) {
        InquiriesModel inquiry = inquiriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inquiry not found"));
        return convertToDto(inquiry);
    }

    public InquiriesDto createInquiry(InquiriesDto inquiriesDto) {
        InquiriesModel inquiry = new InquiriesModel();
        inquiry.setUser(userRepository.findById(inquiriesDto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found")));
        inquiry.setProperty(propertiesRepository.findById(inquiriesDto.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found")));
        inquiry.setQuestion(inquiriesDto.getQuestion());
        inquiry.setAnswer(inquiriesDto.getAnswer());
        inquiry.setStatus(inquiriesDto.getStatus());
        
        return convertToDto(inquiriesRepository.save(inquiry));
    }

    public InquiriesDto updateInquiry(Long id, InquiriesDto inquiriesDto) {
        InquiriesModel inquiry = inquiriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inquiry not found"));
        
        inquiry.setQuestion(inquiriesDto.getQuestion());
        inquiry.setAnswer(inquiriesDto.getAnswer());
        inquiry.setStatus(inquiriesDto.getStatus());
        
        return convertToDto(inquiriesRepository.save(inquiry));
    }

    public void deleteInquiry(Long id) {
        inquiriesRepository.deleteById(id);
    }

    private InquiriesDto convertToDto(InquiriesModel inquiry) {
        InquiriesDto dto = new InquiriesDto();
        dto.setId(inquiry.getId());
        dto.setUserId(inquiry.getUser().getId());
        dto.setPropertyId(inquiry.getProperty().getId());
        dto.setQuestion(inquiry.getQuestion());
        dto.setAnswer(inquiry.getAnswer());
        dto.setStatus(inquiry.getStatus());
        dto.setCreatedAt(inquiry.getCreatedAt());
        return dto;
    }
}
