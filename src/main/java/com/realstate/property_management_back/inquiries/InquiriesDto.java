package com.realstate.property_management_back.inquiries;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InquiriesDto {
    private Long id;
    private Long userId;
    private Long propertyId;
    private String question;
    private String answer;
    private InquiriesModel.InquiryStatus status;
    private LocalDateTime createdAt;
}
