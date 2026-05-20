package com.realstate.property_management_back.favorites;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FavoritsRepository extends JpaRepository<FavoritsModel, Long> {
}
