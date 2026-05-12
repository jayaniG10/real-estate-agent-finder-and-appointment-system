package com.realstate.property_management_back.inquiries;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InquiriesRepository extends JpaRepository<InquiriesModel, Long> {
}
