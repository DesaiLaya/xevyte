package com.register.example.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "holidays")
public class Holiday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "holiday_date", nullable = false, unique = true)
    @JsonFormat(pattern = "yyyy-MM-dd") // ensures JSON <-> LocalDate is yyyy-MM-dd
    private LocalDate holidayDate;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean optionalHoliday = false;

    public Holiday() {}

    public Holiday(LocalDate holidayDate, String name, boolean optionalHoliday) {
        this.holidayDate = holidayDate;
        this.name = name;
        this.optionalHoliday = optionalHoliday;
    }

    // ----- getters & setters -----
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getHolidayDate() { return holidayDate; }
    public void setHolidayDate(LocalDate holidayDate) { this.holidayDate = holidayDate; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isOptionalHoliday() { return optionalHoliday; }
    public void setOptionalHoliday(boolean optionalHoliday) { this.optionalHoliday = optionalHoliday; }
}
