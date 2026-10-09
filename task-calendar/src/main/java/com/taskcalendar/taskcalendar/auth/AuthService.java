package com.taskcalendar.taskcalendar.auth;

import com.taskcalendar.taskcalendar.user.User;

public interface AuthService {
    User registerUser(User user);
    String loginUser(String email,String password);
}
