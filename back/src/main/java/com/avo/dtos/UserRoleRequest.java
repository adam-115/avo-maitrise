package com.avo.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRoleRequest {
    @NotBlank
    private String userId;
    
    @NotBlank
    private String roleName;
    
    private boolean add = true; // true = add, false = remove

}
