package com.taskcalendar.taskcalendar.auth.controller;

import com.taskcalendar.taskcalendar.auth.AuthService;
import com.taskcalendar.taskcalendar.user.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/api/auth/register")
    public ResponseEntity<User> register(@RequestBody User user) {

        System.out.println("REGISTER CONTROLLER REACHED");

        User registeredUser = authService.registerUser(user);

        registeredUser.setPassword(null);

        return ResponseEntity.ok(registeredUser);
    }

   @PostMapping("/api/auth/login")
    public ResponseEntity<String> login(@RequestBody User user){
        String token = authService.loginUser(user.getEmail(), user.getPassword());
        return ResponseEntity.ok(token);
   }

}
