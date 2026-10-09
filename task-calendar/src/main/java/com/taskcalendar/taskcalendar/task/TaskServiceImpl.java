package com.taskcalendar.taskcalendar.task;

import com.taskcalendar.taskcalendar.user.User;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final SubTaskRepository subTaskRepository;

    public TaskServiceImpl(
            TaskRepository taskRepository,
            SubTaskRepository subTaskRepository
    ) {
        this.taskRepository = taskRepository;
        this.subTaskRepository = subTaskRepository;
    }

    @Override
    public Task createTask(
            String title,
            String description,
            User user,
            LocalDate taskDate
    ) {
        Task task = new Task(
                title,
                description,
                taskDate,
                user
        );

        return taskRepository.save(task);
    }

    @Override
    public List<Task> getTasksByUser(User user) {
        return taskRepository.findByUser(user);
    }

    @Override
    public Task getTaskById(Long taskId, User user) {
        return taskRepository.findById(taskId)
                .filter(task -> task.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new TaskException("Task not found"));
    }

    @Override
    public Task updateTask(
            Long taskId,
            String title,
            String description,
            boolean completed,
            LocalDate taskDate,
            User user
    ) {
        Task task = getTaskById(taskId, user);

        task.setTitle(title);
        task.setDescription(description);
        task.setTaskDate(taskDate);

        /*
         * If the task has no subtasks,
         * the user can manually change its completion status.
         *
         * If subtasks exist, completion is controlled
         * by the completion status of those subtasks.
         */
        if (task.getSubTasks().isEmpty()) {
            task.setCompleted(completed);
        }

        return taskRepository.save(task);
    }

    @Override
    public void deleteTask(Long taskId, User user) {
        Task task = getTaskById(taskId, user);

        taskRepository.delete(task);
    }

    @Override
    public SubTask createSubTask(
            Long taskId,
            String title,
            User user
    ) {
        Task task = getTaskById(taskId, user);

        SubTask subTask = new SubTask(title, task);

        SubTask savedSubTask = subTaskRepository.save(subTask);

        updateTaskCompletion(task);

        return savedSubTask;
    }

    @Override
    public SubTask updateSubTask(
            Long subTaskId,
            String title,
            boolean completed,
            User user
    ) {
        SubTask subTask = subTaskRepository.findById(subTaskId)
                .orElseThrow(() -> new TaskException("SubTask not found"));

        Task task = subTask.getTask();

        /*
         * Make sure the SubTask belongs to a Task
         * owned by the currently authenticated user.
         */
        if (!task.getUser().getId().equals(user.getId())) {
            throw new TaskException("SubTask not found");
        }

        subTask.setTitle(title);
        subTask.setCompleted(completed);

        SubTask savedSubTask = subTaskRepository.save(subTask);

        updateTaskCompletion(task);

        return savedSubTask;
    }

    @Override
    public void deleteSubTask(Long subTaskId, User user) {
        SubTask subTask = subTaskRepository.findById(subTaskId)
                .orElseThrow(() -> new TaskException("SubTask not found"));

        Task task = subTask.getTask();

        /*
         * Make sure the SubTask belongs to a Task
         * owned by the currently authenticated user.
         */
        if (!task.getUser().getId().equals(user.getId())) {
            throw new TaskException("SubTask not found");
        }

        subTaskRepository.delete(subTask);

        task.getSubTasks().remove(subTask);

        updateTaskCompletion(task);
    }

    private void updateTaskCompletion(Task task) {

        List<SubTask> subTasks = task.getSubTasks();

        /*
         * If there are no subtasks, don't automatically
         * change the task's completion status.
         */
        if (subTasks.isEmpty()) {
            return;
        }

        /*
         * Task is completed only when ALL subtasks
         * are completed.
         */
        boolean allCompleted = subTasks.stream()
                .allMatch(SubTask::isCompleted);

        task.setCompleted(allCompleted);

        taskRepository.save(task);
    }
}