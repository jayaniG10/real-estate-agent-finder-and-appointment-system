package com.realstate.property_management_back.ratings;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RatingsRepository extends JpaRepository<RatingsModel, Long> {
}
