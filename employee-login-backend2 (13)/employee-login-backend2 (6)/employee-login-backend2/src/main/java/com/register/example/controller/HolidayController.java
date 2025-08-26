package com.register.example.controller;

import com.register.example.entity.Holiday;
import com.register.example.service.HolidayService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/holidays")
@CrossOrigin(origins = {"http://localhost:3000"}) // React dev origin
public class HolidayController {

    private final HolidayService service;

    public HolidayController(HolidayService service) {
        this.service = service;
    }

    // ----- CREATE -----
    @PostMapping
    public ResponseEntity<Holiday> create(@RequestBody Holiday holiday) {
        return ResponseEntity.ok(service.create(holiday));
    }

    // ----- UPDATE -----
    @PutMapping("/{id}")
    public ResponseEntity<Holiday> update(@PathVariable Long id, @RequestBody Holiday holiday) {
        return ResponseEntity.ok(service.update(id, holiday));
    }

    // ----- DELETE -----
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ----- GET ALL -----
    @GetMapping
    public ResponseEntity<List<Holiday>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    // ----- GET BY ID -----
    @GetMapping("/{id}")
    public ResponseEntity<Holiday> getById(@PathVariable Long id) {
        return service.getById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ----- GET BY DATE (yyyy-MM-dd) -----
    @GetMapping("/date/{date}")
    public ResponseEntity<Holiday> getByDate(@PathVariable String date) {
        LocalDate d = LocalDate.parse(date); // yyyy-MM-dd
        return service.getByDate(d).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ----- GET BY MONTH (1..12) -----
    @GetMapping("/{year}/{month}")
    public ResponseEntity<List<Holiday>> getByMonth(@PathVariable int year, @PathVariable int month) {
        return ResponseEntity.ok(service.getByMonth(year, month));
    }

    // ----- GET BY YEAR -----
    @GetMapping("/year/{year}")
    public ResponseEntity<List<Holiday>> getByYear(@PathVariable int year) {
        return ResponseEntity.ok(service.getByYear(year));
    }
}
