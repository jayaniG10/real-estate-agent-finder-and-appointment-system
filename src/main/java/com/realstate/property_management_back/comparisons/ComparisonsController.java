package com.realstate.property_management_back.comparisons;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comparisons")
@RequiredArgsConstructor
public class ComparisonsController {

    private final ComparisonsService comparisonsService;

    @GetMapping
    public List<ComparisonsDto> getAllComparisons() {
        return comparisonsService.getAllComparisons();
    }

    @GetMapping("/user/{userId}")
    public List<ComparisonsDto> getComparisonsByUserId(@PathVariable Long userId) {
        return comparisonsService.getComparisonsByUserId(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ComparisonsDto addComparison(@RequestBody ComparisonsDto comparisonsDto) {
        return comparisonsService.addComparison(comparisonsDto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComparison(@PathVariable Long id) {
        comparisonsService.deleteComparison(id);
    }
}
