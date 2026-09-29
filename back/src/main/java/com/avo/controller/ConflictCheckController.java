package com.avo.controller;

import com.avo.dto.ConflictCheckResultDTO;
import com.avo.services.ConflictCheckService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/Dossier/conflict-check")
public class ConflictCheckController {

    @Autowired
    private ConflictCheckService conflictCheckService;

    @GetMapping("/{contactId}")
    public ResponseEntity<ConflictCheckResultDTO> checkConflict(@PathVariable Long contactId) {
        ConflictCheckResultDTO result = conflictCheckService.checkConflictByContactId(contactId);
        return ResponseEntity.ok(result);
    }
}
