package com.realstate.property_management_back.comparisons;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ComparisonsDto {
    private Long id;
    private Long userId;
    private Long propertyId;
    private LocalDateTime createdAt;
}
