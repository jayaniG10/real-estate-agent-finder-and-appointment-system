package com.realstate.property_management_back.ratings;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ratings")
public class RatingsController {

    @Autowired
    private RatingsService ratingsService;

    @GetMapping
    public List<RatingsDto> getAllRatings() {
        return ratingsService.getAllRatings();
    }

    @GetMapping("/{id}")
    public ResponseEntity<RatingsDto> getRatingById(@PathVariable Long id) {
        return ResponseEntity.ok(ratingsService.getRatingById(id));
    }

    @PostMapping
    public RatingsDto createRating(@RequestBody RatingsDto ratingsDto) {
        return ratingsService.createRating(ratingsDto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RatingsDto> updateRating(@PathVariable Long id, @RequestBody RatingsDto ratingsDto) {
        return ResponseEntity.ok(ratingsService.updateRating(id, ratingsDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRating(@PathVariable Long id) {
        ratingsService.deleteRating(id);
        return ResponseEntity.noContent().build();
    }

}
