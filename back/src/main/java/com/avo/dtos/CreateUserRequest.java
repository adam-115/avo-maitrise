package com.avo.dtos;

import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {
 @NotBlank
    private String username;
    
    @Email
    @NotBlank
    private String email;
    
    private String firstName;
    private String lastName;
    private String password;
    private boolean enabled = true;
    private List<String> roles;
    private List<String> requiredActions;
}
