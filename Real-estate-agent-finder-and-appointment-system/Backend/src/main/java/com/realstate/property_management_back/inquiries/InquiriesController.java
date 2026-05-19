package com.realstate.property_management_back.inquiries;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiriesController {

    private final InquiriesService inquiriesService;

    @GetMapping
    public List<InquiriesDto> getAllInquiries() {
        return inquiriesService.getAllInquiries();
    }

    @GetMapping("/{id}")
    public InquiriesDto getInquiryById(@PathVariable Long id) {
        return inquiriesService.getInquiryById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InquiriesDto createInquiry(@RequestBody InquiriesDto inquiriesDto) {
        return inquiriesService.createInquiry(inquiriesDto);
    }

    @PutMapping("/{id}")
    public InquiriesDto updateInquiry(@PathVariable Long id, @RequestBody InquiriesDto inquiriesDto) {
        return inquiriesService.updateInquiry(id, inquiriesDto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteInquiry(@PathVariable Long id) {
        inquiriesService.deleteInquiry(id);
    }
}
