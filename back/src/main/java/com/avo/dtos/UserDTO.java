package com.avo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String email;
    private String username;
    private String firstName;
    private String lastName;
    private String role;
    private String photoBlob;
    private String barreauId;
    private String phoneNumber;
    private String gsm;
    private String address;
    private boolean isPartner;
    private boolean isActive;
    private String avatarUrl;
    private Date lastLogin;
    private Date createdAt;
}
