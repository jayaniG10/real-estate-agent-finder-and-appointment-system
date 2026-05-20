package com.realstate.property_management_back.properties;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertiesDto {
    private Long id;
    private String title;
    private BigDecimal price;
    private String location;
    private String description;
    private String image;
    private Long addedBy;
    private PropertiesModel.PropertyStatus status;
    private LocalDateTime createdAt;
}
