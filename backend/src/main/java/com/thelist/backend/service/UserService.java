package com.thelist.backend.service;

import com.thelist.backend.exception.ResourceNotFoundException;
import com.thelist.backend.model.User;
import com.thelist.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));
    }

    public User createUser(User user) {
        // Podrías agregar validaciones extra aquí.
        return userRepository.save(user);
    }
}
