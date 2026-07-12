package com.avo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.avo.dtos.CabinetProfileDTO;
import com.avo.services.CabinetProfileService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/cabinet-profile")
@Slf4j
public class CabinetProfileController {

    private final CabinetProfileService service;

    public CabinetProfileController(CabinetProfileService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<CabinetProfileDTO> getProfile() {
        log.info("REST request to get CabinetProfile");
        return ResponseEntity.ok(service.getProfile());
    }

    @PutMapping
    public ResponseEntity<CabinetProfileDTO> updateProfile(@RequestBody CabinetProfileDTO dto) {
        log.info("REST request to update CabinetProfile");
        return ResponseEntity.ok(service.updateProfile(dto));
    }
}
