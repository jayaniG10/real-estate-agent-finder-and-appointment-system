package com.realstate.property_management_back.comparisons;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComparisonsRepository extends JpaRepository<ComparisonsModel, Long> {
}
