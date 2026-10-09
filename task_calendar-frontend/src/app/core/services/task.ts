import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Task, SubTask } from '../../shared/models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TaskService {

  private apiUrl = `${environment.apiUrl}/api/tasks`;

  constructor(private http: HttpClient) {}

  // =========================
  // TASK APIs
  // =========================

  createTask(
    title: string,
    description: string,
    taskDate: string
  ): Observable<Task> {

    return this.http.post<Task>(
      this.apiUrl,
      {
        title,
        description,
        taskDate
      }
    );
  }

  getTasks(): Observable<Task[]> {

    return this.http.get<Task[]>(
      this.apiUrl
    );
  }

  getTaskById(taskId: number): Observable<Task> {

    return this.http.get<Task>(
      `${this.apiUrl}/${taskId}`
    );
  }

  updateTask(
    taskId: number,
    title: string,
    description: string,
    completed: boolean,
    taskDate: string
  ): Observable<Task> {

    return this.http.put<Task>(
      `${this.apiUrl}/${taskId}`,
      {
        title,
        description,
        completed,
        taskDate
      }
    );
  }

  deleteTask(taskId: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${taskId}`
    );
  }

  // =========================
  // SUBTASK APIs
  // =========================

  createSubTask(
    taskId: number,
    title: string
  ): Observable<SubTask> {

    return this.http.post<SubTask>(
      `${this.apiUrl}/${taskId}/subtasks`,
      {
        title
      }
    );
  }

  updateSubTask(
    subTaskId: number,
    title: string,
    completed: boolean
  ): Observable<SubTask> {

    return this.http.put<SubTask>(
      `${this.apiUrl}/subtasks/${subTaskId}`,
      {
        title,
        completed
      }
    );
  }

  deleteSubTask(subTaskId: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/subtasks/${subTaskId}`
    );
  }
}