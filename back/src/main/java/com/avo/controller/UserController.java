package com.avo.controller;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.querydsl.binding.QuerydslPredicate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.avo.dtos.UserDTO;
import com.avo.entities.AppUser;
import com.avo.services.UserService;
import com.querydsl.core.types.Predicate;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping("/me/roles")
    public ResponseEntity<java.util.Map<String, Object>> getCurrentUserRoles() {
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        java.util.List<String> roles = (auth == null || auth.getAuthorities() == null)
                ? java.util.List.of()
                : auth.getAuthorities().stream()
                        .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                        .distinct()
                        .toList();
        return ResponseEntity.ok(java.util.Map.of(
                "username", auth != null ? auth.getName() : "",
                "roles", roles
        ));
    }

    @GetMapping
    public ResponseEntity<Page<UserDTO>> findAll(Pageable pageable) {
        return ResponseEntity.ok(service.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<UserDTO>> search(@QuerydslPredicate(root = AppUser.class) Predicate predicate, Pageable pageable) {
        return ResponseEntity.ok(service.search(predicate, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping
    public ResponseEntity<UserDTO> create(@Valid @RequestBody UserDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @PutMapping(value = {"", "/{id}"})
    public ResponseEntity<UserDTO> update(@PathVariable(required = false) Long id, @Valid @RequestBody UserDTO dto) {
        if (id != null && dto.getId() == null) {
            dto.setId(id);
        }
        return ResponseEntity.ok(service.update(dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/disable")
    public ResponseEntity<Void> disableUser(@PathVariable Long id) {
        service.disableUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<String> resetPassword(@PathVariable Long id) {
        service.resetPassword(id);
        return ResponseEntity.ok("Mot de passe reinitialisé avec succes");
    }

    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin')")
    @PostMapping("/{id}/sync-keycloak")
    public ResponseEntity<UserDTO> syncKeycloak(@PathVariable Long id) {
        return ResponseEntity.ok(service.syncWithKeycloak(id));
    }

    @PostMapping("/{id}/reconfigure-otp")
    public ResponseEntity<Void> reconfigureOtp(@PathVariable Long id) {
        service.requireOtpReconfiguration(id);
        return ResponseEntity.noContent().build();
    }
}
