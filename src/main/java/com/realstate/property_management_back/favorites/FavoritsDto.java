package com.realstate.property_management_back.favorites;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FavoritsDto {
    private Long id;
    private Long userId;
    private Long propertyId;
    private String notes;
    private LocalDateTime createdAt;
}
