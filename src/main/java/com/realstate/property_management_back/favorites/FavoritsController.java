package com.realstate.property_management_back.favorites;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/favorites")
public class FavoritsController {

    @Autowired
    private FavoritsService favoritsService;

    @GetMapping
    public List<FavoritsDto> getAllFavorites() {
        return favoritsService.getAllFavorites();
    }

    @GetMapping("/{id}")
    public ResponseEntity<FavoritsDto> getFavoriteById(@PathVariable Long id) {
        return ResponseEntity.ok(favoritsService.getFavoriteById(id));
    }

    @PostMapping
    public FavoritsDto createFavorite(@RequestBody FavoritsDto favoritsDto) {
        return favoritsService.createFavorite(favoritsDto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FavoritsDto> updateFavorite(@PathVariable Long id, @RequestBody FavoritsDto favoritsDto) {
        return ResponseEntity.ok(favoritsService.updateFavorite(id, favoritsDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFavorite(@PathVariable Long id) {
        favoritsService.deleteFavorite(id);
        return ResponseEntity.noContent().build();
    }
}
