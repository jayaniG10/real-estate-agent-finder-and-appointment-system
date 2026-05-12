package com.realstate.property_management_back.ratings;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RatingsDto {
    private Long id;
    private Long userId;
    private Long propertyId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
