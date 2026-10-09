package com.taskcalendar.taskcalendar.task;

import com.taskcalendar.taskcalendar.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task,Long> {
    List<Task> findByUser(User user);
}
