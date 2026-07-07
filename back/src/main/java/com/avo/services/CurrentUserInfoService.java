package com.avo.services;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.avo.entities.AppUser;
import com.avo.repositories.UserRepository;

@Service
public class CurrentUserInfoService {

    private final UserRepository userRepository;


    public CurrentUserInfoService(final UserRepository userRepository){
        this.userRepository = userRepository;
    }

    public String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            return auth.getName();
        }
        return null;
    }

    public AppUser getCurrentUser(){
         return this.userRepository.findByUsername(getCurrentUsername()).orElse(null);
    }

}
