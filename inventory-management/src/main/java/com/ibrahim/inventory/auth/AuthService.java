package com.ibrahim.inventory.auth;

import com.ibrahim.inventory.auth.dto.RegisterRequest;
import com.ibrahim.inventory.auth.dto.RegisterResponse;
import com.ibrahim.inventory.user.AppUser;
import com.ibrahim.inventory.user.AppUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.ibrahim.inventory.exception.EmailAlreadyExistsException;

import com.ibrahim.inventory.auth.dto.LoginRequest;
import com.ibrahim.inventory.auth.dto.LoginResponse;
import com.ibrahim.inventory.exception.InvalidCredentialsException;

import com.ibrahim.inventory.security.jwt.JwtService;
import com.ibrahim.inventory.exception.InvalidRoleException;


@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public RegisterResponse register(RegisterRequest request) {

        if (appUserRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists");
        }

        String normalizedRole = validateAndNormalizeRole(request.getRole());

        AppUser user = new AppUser();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(normalizedRole);

        AppUser savedUser = appUserRepository.save(user);

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                "User registered successfully"
        );
    }
    public LoginResponse login(LoginRequest request) {

        System.out.println("login request service method");
        AppUser user = appUserRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        );

        if (!passwordMatches) {
            throw new InvalidCredentialsException("Invalid email or password");
        }
        String token = jwtService.generateToken(user);

        return new LoginResponse(
                token,
                "Bearer",
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
    private String validateAndNormalizeRole(String role) {

        String normalizedRole = role.trim().toUpperCase();

        if (!normalizedRole.equals("ADMIN") && !normalizedRole.equals("STAFF")) {
            throw new InvalidRoleException("Role must be ADMIN or STAFF");
        }

        return normalizedRole;
    }
}