package com.realstate.property_management_back.properties;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/properties")
public class PropertiesController {

    @Autowired
    private PropertiesService propertiesService;

    @GetMapping
    public List<PropertiesDto> getAllProperties() {
        return propertiesService.getAllProperties();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PropertiesDto> getPropertyById(@PathVariable Long id) {
        return ResponseEntity.ok(propertiesService.getPropertyById(id));
    }

    @PostMapping
    public PropertiesDto createProperty(@RequestBody PropertiesDto propertiesDto) {
        return propertiesService.createProperty(propertiesDto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PropertiesDto> updateProperty(@PathVariable Long id, @RequestBody PropertiesDto propertiesDto) {
        return ResponseEntity.ok(propertiesService.updateProperty(id, propertiesDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProperty(@PathVariable Long id) {
        propertiesService.deleteProperty(id);
        return ResponseEntity.noContent().build();
    }
}
