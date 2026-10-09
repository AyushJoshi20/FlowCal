package com.taskcalendar.taskcalendar.task.controller;

import com.taskcalendar.taskcalendar.task.SubTask;
import com.taskcalendar.taskcalendar.task.Task;
import com.taskcalendar.taskcalendar.task.TaskService;
import com.taskcalendar.taskcalendar.user.User;
import com.taskcalendar.taskcalendar.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;
    private final UserRepository userRepository;

    public TaskController(
            TaskService taskService,
            UserRepository userRepository
    ) {
        this.taskService = taskService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<Task> createTask(
            @RequestBody Task task,
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);

        Task createdTask = taskService.createTask(
                task.getTitle(),
                task.getDescription(),
                user,
                task.getTaskDate()
        );

        return ResponseEntity.ok(createdTask);
    }

    @GetMapping
    public ResponseEntity<List<Task>> getTasks(
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                taskService.getTasksByUser(user)
        );
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<Task> getTaskById(
            @PathVariable Long taskId,
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                taskService.getTaskById(taskId, user)
        );
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<Task> updateTask(
            @PathVariable Long taskId,
            @RequestBody Task task,
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);

        Task updatedTask = taskService.updateTask(
                taskId,
                task.getTitle(),
                task.getDescription(),
                task.isCompleted(),
                task.getTaskDate(),
                user
        );

        return ResponseEntity.ok(updatedTask);
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long taskId,
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);

        taskService.deleteTask(taskId, user);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{taskId}/subtasks")
    public ResponseEntity<SubTask> createSubTask(
            @PathVariable Long taskId,
            @RequestBody SubTask subTask,
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);

        SubTask createdSubTask = taskService.createSubTask(
                taskId,
                subTask.getTitle(),
                user
        );

        return ResponseEntity.ok(createdSubTask);
    }

    @PutMapping("/subtasks/{subTaskId}")
    public ResponseEntity<SubTask> updateSubTask(
            @PathVariable Long subTaskId,
            @RequestBody SubTask subTask,
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);

        SubTask updatedSubTask = taskService.updateSubTask(
                subTaskId,
                subTask.getTitle(),
                subTask.isCompleted(),
                user
        );

        return ResponseEntity.ok(updatedSubTask);
    }

    @DeleteMapping("/subtasks/{subTaskId}")
    public ResponseEntity<Void> deleteSubTask(
            @PathVariable Long subTaskId,
            Authentication authentication
    ) {
        User user = getAuthenticatedUser(authentication);

        taskService.deleteSubTask(subTaskId, user);

        return ResponseEntity.noContent().build();
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}