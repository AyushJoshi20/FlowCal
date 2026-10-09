package com.taskcalendar.taskcalendar.task;

import com.taskcalendar.taskcalendar.user.User;

import java.time.LocalDate;
import java.util.List;

public interface TaskService {

    Task createTask(
            String title,
            String description,
            User user,
            LocalDate taskDate
    );

    List<Task> getTasksByUser(User user);

    Task getTaskById(Long taskId, User user);

    Task updateTask(
            Long taskId,
            String title,
            String description,
            boolean completed,
            LocalDate taskDate,
            User user
    );

    void deleteTask(Long taskId, User user);

    SubTask createSubTask(
            Long taskId,
            String title,
            User user
    );

    SubTask updateSubTask(
            Long subTaskId,
            String title,
            boolean completed,
            User user
    );

    void deleteSubTask(Long subTaskId, User user);
}