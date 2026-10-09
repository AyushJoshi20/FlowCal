import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Observable,
  forkJoin,
  map,
  of,
  switchMap
} from 'rxjs';

import { TaskService } from '../../core/services/task';
import { Task, SubTask } from '../../shared/models/task.model';

type CalendarView = 'month' | 'week' | 'year';

interface CalendarDay {
  date: number;
  currentMonth: boolean;
  isToday: boolean;
  fullDate: Date;
}

interface MiniMonthDay {
  date: number;
  currentMonth: boolean;
}

interface MiniMonth {
  name: string;
  monthIndex: number;
  days: MiniMonthDay[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class Calendar implements OnInit {

  currentDate = new Date();

  selectedView: CalendarView = 'month';

  tasks: Task[] = [];

  weekDays = [
    'SUN',
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT'
  ];


  // =====================================================
  // MODAL
  // =====================================================

  modalOpen = false;

  modalMode: 'create' | 'edit' = 'create';

  modalTaskId?: number;

  modalTitle = '';

  modalDescription = '';

  modalDate = '';

  modalCompleted = false;

  modalSubTasks: SubTask[] = [];

  originalSubTasks: SubTask[] = [];

  newSubtaskTitle = '';

  modalError = '';

  saving = false;

  private openCreateAfterSave = false;


  // =====================================================
  // TOAST
  // =====================================================

  toastVisible = false;

  toastMessage = '';

  toastActionLabel = '';

  private toastAction: (() => void) | null = null;

  private toastTimer: ReturnType<typeof setTimeout> | null = null;


  constructor(
    private taskService: TaskService
  ) {}


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  ngOnInit(): void {
    this.loadTasks();
  }


  loadTasks(): void {

    this.taskService.getTasks().subscribe({

      next: (tasks) => {
        this.tasks = tasks;
      },

      error: (error) => {
        console.error(
          'Failed to load tasks:',
          error
        );
      }

    });

  }


  // =====================================================
  // TASKS FOR DATE
  // =====================================================

  getTasksForDate(date: Date): Task[] {

    const dateString = this.formatDate(date);

    return this.tasks.filter(
      task => task.taskDate === dateString
    );

  }

  getVisibleTasksForDate(date: Date): Task[] {

    // Month view shows only the first task.
    // All remaining tasks are available in Week view.
    return this.getTasksForDate(date)
      .slice(0, 1);

  }

  getHiddenTaskCount(date: Date): number {

    const count =
      this.getTasksForDate(date).length;

    // Everything after the first task
    // belongs to the Week view.
    return Math.max(0, count - 1);

  }


  getCompletedSubTaskCount(
    task: Task
  ): number {

    return (task.subTasks ?? [])
      .filter(subTask => subTask.completed)
      .length;

  }

    // =====================================================
  // WEEK PROGRESS
  // =====================================================

  getWeekProgress(date: Date): number {

    const tasks =
      this.getTasksForDate(date);

    if (tasks.length === 0) {
      return 0;
    }

    let totalItems = 0;
    let completedItems = 0;


    for (const task of tasks) {

      const subTasks =
        task.subTasks ?? [];


      /*
       * If a task has subtasks,
       * the subtasks represent its actual work.
       *
       * We do NOT count the parent task separately,
       * otherwise the task would be double-counted.
       */

      if (subTasks.length > 0) {

        totalItems += subTasks.length;

        completedItems += subTasks.filter(
          subTask => subTask.completed
        ).length;

      }


      /*
       * A task without subtasks is itself
       * one unit of work.
       */

      else {

        totalItems += 1;

        if (task.completed) {

          completedItems += 1;

        }

      }

    }


    if (totalItems === 0) {
      return 0;
    }


    return Math.round(
      (completedItems / totalItems) * 100
    );

  }


  getWeekProgressCompletedItems(
    date: Date
  ): number {

    const tasks =
      this.getTasksForDate(date);

    let completedItems = 0;


    for (const task of tasks) {

      const subTasks =
        task.subTasks ?? [];


      if (subTasks.length > 0) {

        completedItems += subTasks.filter(
          subTask => subTask.completed
        ).length;

      }

      else if (task.completed) {

        completedItems += 1;

      }

    }


    return completedItems;

  }


  getWeekProgressTotalItems(
    date: Date
  ): number {

    const tasks =
      this.getTasksForDate(date);

    let totalItems = 0;


    for (const task of tasks) {

      const subTasks =
        task.subTasks ?? [];


      if (subTasks.length > 0) {

        totalItems += subTasks.length;

      }

      else {

        totalItems += 1;

      }

    }


    return totalItems;

  }


  getWeekProgressClass(
    progress: number
  ): string {

    if (progress >= 100) {

      return 'progress-green';

    }


    if (progress >= 75) {

      return 'progress-light-green';

    }


    if (progress >= 50) {

      return 'progress-yellow';

    }


    if (progress >= 25) {

      return 'progress-blue';

    }


    return 'progress-grey';

  }


  // =====================================================
  // DATE HELPERS
  // =====================================================

  private formatDate(date: Date): string {

    const year =
      date.getFullYear();

    const month =
      String(date.getMonth() + 1)
        .padStart(2, '0');

    const day =
      String(date.getDate())
        .padStart(2, '0');

    return `${year}-${month}-${day}`;

  }


  // =====================================================
  // HEADER
  // =====================================================

  get headerTitle(): string {

    if (this.selectedView === 'month') {

      return this.currentDate.toLocaleString(
        'default',
        {
          month: 'long',
          year: 'numeric'
        }
      );

    }


    if (this.selectedView === 'week') {

      return this.getWeekTitle();

    }


    return this.currentDate
      .getFullYear()
      .toString();

  }


  // =====================================================
  // MONTH
  // =====================================================

  get calendarDays(): CalendarDay[] {

    const year =
      this.currentDate.getFullYear();

    const month =
      this.currentDate.getMonth();

    const firstDay =
      new Date(year, month, 1);

    const daysInMonth =
      new Date(
        year,
        month + 1,
        0
      ).getDate();

    const startingDay =
      firstDay.getDay();

    const daysInPreviousMonth =
      new Date(
        year,
        month,
        0
      ).getDate();

    const days: CalendarDay[] = [];


    // Previous month

    for (
      let i = startingDay - 1;
      i >= 0;
      i--
    ) {

      const date =
        daysInPreviousMonth - i;

      days.push({

        date,

        currentMonth: false,

        isToday: false,

        fullDate:
          new Date(
            year,
            month - 1,
            date
          )

      });

    }


    // Current month

    for (
      let date = 1;
      date <= daysInMonth;
      date++
    ) {

      days.push({

        date,

        currentMonth: true,

        isToday:
          this.isToday(
            year,
            month,
            date
          ),

        fullDate:
          new Date(
            year,
            month,
            date
          )

      });

    }


    const gridSize =
      days.length <= 35
        ? 35
        : 42;


    const remainingDays =
      gridSize - days.length;


    // Next month

    for (
      let date = 1;
      date <= remainingDays;
      date++
    ) {

      days.push({

        date,

        currentMonth: false,

        isToday: false,

        fullDate:
          new Date(
            year,
            month + 1,
            date
          )

      });

    }


    return days;

  }


  // =====================================================
  // WEEK
  // =====================================================

  get weekDaysData(): CalendarDay[] {

    const startOfWeek =
      this.getStartOfWeek(
        this.currentDate
      );

    return Array.from(
      { length: 7 },
      (_, index) => {

        const date =
          new Date(startOfWeek);

        date.setDate(
          startOfWeek.getDate() + index
        );

        return {

          date: date.getDate(),

          currentMonth:
            date.getMonth() ===
            this.currentDate.getMonth(),

          isToday:
            this.isSameDay(
              date,
              new Date()
            ),

          fullDate: date

        };

      }
    );

  }


  // =====================================================
  // YEAR
  // =====================================================

  get miniMonths(): MiniMonth[] {

    const year =
      this.currentDate.getFullYear();

    return Array.from(
      { length: 12 },
      (_, monthIndex) => {

        const monthName =
          new Date(
            year,
            monthIndex,
            1
          ).toLocaleString(
            'default',
            {
              month: 'short'
            }
          );

        return {

          name: monthName,

          monthIndex,

          days:
            this.getMiniMonthDays(
              year,
              monthIndex
            )

        };

      }
    );

  }


  private getMiniMonthDays(
    year: number,
    month: number
  ): MiniMonthDay[] {

    const firstDay =
      new Date(year, month, 1);

    const startingDay =
      firstDay.getDay();

    const daysInMonth =
      new Date(
        year,
        month + 1,
        0
      ).getDate();

    const daysInPreviousMonth =
      new Date(
        year,
        month,
        0
      ).getDate();

    const days: MiniMonthDay[] = [];


    for (
      let i = startingDay - 1;
      i >= 0;
      i--
    ) {

      days.push({

        date:
          daysInPreviousMonth - i,

        currentMonth: false

      });

    }


    for (
      let date = 1;
      date <= daysInMonth;
      date++
    ) {

      days.push({

        date,

        currentMonth: true

      });

    }


    const gridSize =
      days.length <= 35
        ? 35
        : 42;


    const remainingDays =
      gridSize - days.length;


    for (
      let date = 1;
      date <= remainingDays;
      date++
    ) {

      days.push({

        date,

        currentMonth: false

      });

    }


    return days;

  }


  // =====================================================
  // VIEW
  // =====================================================

  selectView(
    view: CalendarView
  ): void {

    this.selectedView = view;

  }


  selectMonth(
    monthIndex: number
  ): void {

    this.currentDate =
      new Date(
        this.currentDate.getFullYear(),
        monthIndex,
        1
      );

    this.selectedView = 'month';

  }


  // =====================================================
  // NAVIGATION
  // =====================================================

  previous(): void {

    if (this.selectedView === 'month') {

      this.currentDate =
        new Date(
          this.currentDate.getFullYear(),
          this.currentDate.getMonth() - 1,
          1
        );

      return;

    }


    if (this.selectedView === 'week') {

      const newDate =
        new Date(this.currentDate);

      newDate.setDate(
        newDate.getDate() - 7
      );

      this.currentDate = newDate;

      return;

    }


    const newDate =
      new Date(this.currentDate);

    newDate.setFullYear(
      newDate.getFullYear() - 1
    );

    this.currentDate = newDate;

  }


  next(): void {

    if (this.selectedView === 'month') {

      this.currentDate =
        new Date(
          this.currentDate.getFullYear(),
          this.currentDate.getMonth() + 1,
          1
        );

      return;

    }


    if (this.selectedView === 'week') {

      const newDate =
        new Date(this.currentDate);

      newDate.setDate(
        newDate.getDate() + 7
      );

      this.currentDate = newDate;

      return;

    }


    const newDate =
      new Date(this.currentDate);

    newDate.setFullYear(
      newDate.getFullYear() + 1
    );

    this.currentDate = newDate;

  }


  // =====================================================
  // WEEK HELPERS
  // =====================================================

  private getStartOfWeek(
    date: Date
  ): Date {

    const result =
      new Date(date);

    result.setDate(
      result.getDate() -
      result.getDay()
    );

    result.setHours(
      0,
      0,
      0,
      0
    );

    return result;

  }


  private getWeekTitle(): string {

    const start =
      this.getStartOfWeek(
        this.currentDate
      );

    const end =
      new Date(start);

    end.setDate(
      start.getDate() + 6
    );


    const startMonth =
      start.toLocaleString(
        'default',
        {
          month: 'short'
        }
      );

    const endMonth =
      end.toLocaleString(
        'default',
        {
          month: 'short'
        }
      );


    if (
      start.getFullYear() ===
      end.getFullYear()
    ) {

      if (
        start.getMonth() ===
        end.getMonth()
      ) {

        return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;

      }


      return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;

    }


    return `${startMonth} ${start.getDate()}, ${start.getFullYear()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;

  }


  // =====================================================
  // TODAY
  // =====================================================

  private isToday(
    year: number,
    month: number,
    date: number
  ): boolean {

    return this.isSameDay(
      new Date(year, month, date),
      new Date()
    );

  }


  private isSameDay(
    first: Date,
    second: Date
  ): boolean {

    return (

      first.getFullYear() ===
      second.getFullYear()

      &&

      first.getMonth() ===
      second.getMonth()

      &&

      first.getDate() ===
      second.getDate()

    );

  }


  // =====================================================
  // CREATE
  // =====================================================

  openCreateTask(
    date: Date,
    event?: MouseEvent
  ): void {

    event?.stopPropagation();

    this.modalMode = 'create';

    this.modalTaskId = undefined;

    this.modalTitle = '';

    this.modalDescription = '';

    this.modalDate =
      this.formatDate(date);

    this.modalCompleted = false;

    this.modalSubTasks = [];

    this.originalSubTasks = [];

    this.newSubtaskTitle = '';

    this.modalError = '';

    this.modalOpen = true;

  }


  // =====================================================
  // EDIT
  // =====================================================

  openEditTask(
    task: Task,
    event?: MouseEvent
  ): void {

    event?.stopPropagation();

    this.modalMode = 'edit';

    this.modalTaskId =
      task.id;

    this.modalTitle =
      task.title;

    this.modalDescription =
      task.description;

    this.modalDate =
      task.taskDate;

    this.modalCompleted =
      task.completed;

    this.modalSubTasks =
      (task.subTasks ?? [])
        .map(subTask => ({
          ...subTask
        }));

    this.originalSubTasks =
      (task.subTasks ?? [])
        .map(subTask => ({
          ...subTask
        }));

    this.newSubtaskTitle = '';

    this.modalError = '';

    this.modalOpen = true;

  }


  // =====================================================
  // SUBTASKS
  // =====================================================

  addSubtask(): void {

    const title =
      this.newSubtaskTitle.trim();

    if (!title) {
      return;
    }


    this.modalSubTasks.push({

      title,

      completed: false

    });


    this.newSubtaskTitle = '';

  }


  toggleModalSubtask(
    subTask: SubTask
  ): void {

    if (!subTask.id) {
      return;
    }

    subTask.completed =
      !subTask.completed;

  }


  deleteModalSubtask(
    subTask: SubTask,
    index: number
  ): void {

    if (!subTask.id) {

      this.modalSubTasks
        .splice(index, 1);

      return;

    }


    this.taskService
      .deleteSubTask(subTask.id)
      .subscribe({

        next: () => {

          this.modalSubTasks
            .splice(index, 1);

          this.originalSubTasks =
            this.originalSubTasks.filter(
              original =>
                original.id !==
                subTask.id
            );

        },

        error: (error) => {

          console.error(
            'Failed to delete subtask:',
            error
          );

          this.modalError =
            'Could not delete the subtask.';

        }

      });

  }


  // =====================================================
  // ADD ANOTHER INDEPENDENT TASK
  // =====================================================

  addAnotherTask(): void {

    this.modalError = '';

    if (!this.modalTitle.trim()) {

      this.modalError =
        'Task title is required before adding another task.';

      return;

    }

    if (!this.modalDate) {

      this.modalError =
        'Task date is required before adding another task.';

      return;

    }

    if (
      this.modalSubTasks.some(
        subTask =>
          !subTask.title.trim()
      )
    ) {

      this.modalError =
        'Subtask titles cannot be empty.';

      return;

    }

    if (this.saving) {
      return;
    }

    this.openCreateAfterSave = true;

    this.saveTask();

  }


  // =====================================================
  // SAVE
  // =====================================================

  saveTask(): void {

    this.modalError = '';


    if (!this.modalTitle.trim()) {

      this.modalError =
        'Task title is required.';

      return;

    }


    if (!this.modalDate) {

      this.modalError =
        'Task date is required.';

      return;

    }


    if (
      this.modalSubTasks.some(
        subTask =>
          !subTask.title.trim()
      )
    ) {

      this.modalError =
        'Subtask titles cannot be empty.';

      return;

    }


    if (this.saving) {
      return;
    }


    this.saving = true;


    // -------------------------------------------------
    // CREATE
    // -------------------------------------------------

    if (this.modalMode === 'create') {

      this.taskService
        .createTask(
          this.modalTitle.trim(),
          this.modalDescription.trim(),
          this.modalDate
        )
        .pipe(

          switchMap(createdTask => {

            if (!createdTask.id) {
              return of(createdTask);
            }


            const pendingSubtasks =
              this.modalSubTasks
                .filter(
                  subTask =>
                    !subTask.id
                );


            if (
              pendingSubtasks.length === 0
            ) {

              return of(createdTask);

            }


            const operations =
              pendingSubtasks.map(
                subTask =>
                  this.taskService
                    .createSubTask(
                      createdTask.id!,
                      subTask.title.trim()
                    )
              );


            return forkJoin(
              operations
            ).pipe(
              map(() => createdTask)
            );

          })

        )
        .subscribe({

          next: () => {

            const nextDate =
              this.modalDate;

            const shouldAddAnother =
              this.openCreateAfterSave;

            this.openCreateAfterSave =
              false;

            this.saving = false;

            this.closeModal();

            this.loadTasks();

            this.showToast(
              'Task created'
            );

            if (shouldAddAnother) {

              const [year, month, day] =
                nextDate.split('-').map(Number);

              this.openCreateTask(
                new Date(
                  year,
                  month - 1,
                  day
                )
              );

            }

          },

          error: (error) => {

            this.saving = false;

            console.error(
              'Failed to create task:',
              error
            );

            this.modalError =
              'Could not create the task.';

          }

        });


      return;

    }


    // -------------------------------------------------
    // UPDATE
    // -------------------------------------------------

    if (!this.modalTaskId) {

      this.saving = false;

      return;

    }


    const taskId =
      this.modalTaskId;


    const subtaskOperations:
      Observable<unknown>[] = [];


    for (
      const currentSubTask
      of this.modalSubTasks
    ) {

      if (!currentSubTask.id) {

        subtaskOperations.push(

          this.taskService
            .createSubTask(
              taskId,
              currentSubTask.title.trim()
            )

        );

        continue;

      }


      const original =
        this.originalSubTasks.find(
          subTask =>
            subTask.id ===
            currentSubTask.id
        );


      if (
        original
        &&
        (
          original.title.trim() !==
          currentSubTask.title.trim()

          ||

          original.completed !==
          currentSubTask.completed
        )
      ) {

        subtaskOperations.push(

          this.taskService
            .updateSubTask(
              currentSubTask.id,
              currentSubTask.title.trim(),
              currentSubTask.completed
            )

        );

      }

    }


    this.taskService
      .updateTask(
        taskId,
        this.modalTitle.trim(),
        this.modalDescription.trim(),
        this.modalCompleted,
        this.modalDate
      )
      .pipe(

        switchMap(updatedTask => {

          if (
            subtaskOperations.length === 0
          ) {

            return of(updatedTask);

          }


          return forkJoin(
            subtaskOperations
          ).pipe(
            map(() => updatedTask)
          );

        })

      )
      .subscribe({

        next: () => {

          const nextDate =
            this.modalDate;

          const shouldAddAnother =
            this.openCreateAfterSave;

          this.openCreateAfterSave =
            false;

          this.saving = false;

          this.closeModal();

          this.loadTasks();

          this.showToast(
            'Task updated'
          );

          if (shouldAddAnother) {

            const [year, month, day] =
              nextDate.split('-').map(Number);

            this.openCreateTask(
              new Date(
                year,
                month - 1,
                day
              )
            );

          }

        },

        error: (error) => {

          this.saving = false;

          console.error(
            'Failed to update task:',
            error
          );

          this.modalError =
            'Could not update the task.';

        }

      });

  }


  // =====================================================
  // DELETE TASK
  // =====================================================

  deleteTask(): void {

    if (!this.modalTaskId) {
      return;
    }


    const confirmed =
      window.confirm(
        'Delete this task and all of its subtasks?'
      );


    if (!confirmed) {
      return;
    }


    this.taskService
      .deleteTask(this.modalTaskId)
      .subscribe({

        next: () => {

          this.closeModal();

          this.loadTasks();

          this.showToast(
            'Task deleted'
          );

        },

        error: (error) => {

          console.error(
            'Failed to delete task:',
            error
          );

          this.modalError =
            'Could not delete the task.';

        }

      });

  }


  // =====================================================
  // TASK COMPLETION
  // =====================================================

  toggleTaskCompleted(
    task: Task,
    event: MouseEvent
  ): void {

    event.stopPropagation();

    const targetCompleted =
      !task.completed;


    // If subtasks exist,
    // toggle all subtasks.

    if (
      task.subTasks &&
      task.subTasks.length > 0
    ) {

      const previousStates =
        task.subTasks.map(
          subTask => ({
            id: subTask.id!,
            title: subTask.title,
            completed: subTask.completed
          })
        );


      const operations =
        task.subTasks
          .filter(
            subTask =>
              !!subTask.id
          )
          .map(
            subTask =>
              this.taskService
                .updateSubTask(
                  subTask.id!,
                  subTask.title,
                  targetCompleted
                )
          );


      if (!operations.length) {
        return;
      }


      forkJoin(operations)
        .subscribe({

          next: () => {

            task.subTasks.forEach(
              subTask => {
                subTask.completed =
                  targetCompleted;
              }
            );

            task.completed =
              targetCompleted;


            this.loadTasks();


            this.showToast(

              targetCompleted
                ? 'Task marked as completed'
                : 'Task marked as incomplete',

              'Undo',

              () =>
                this.restoreSubtaskStates(
                  task,
                  previousStates
                )

            );

          },

          error: (error) => {

            console.error(
              'Failed to update task completion:',
              error
            );

            this.loadTasks();

            this.showToast(
              'Could not update task'
            );

          }

        });


      return;

    }


    // No subtasks

    const previous =
      task.completed;


    this.taskService
      .updateTask(
        task.id!,
        task.title,
        task.description,
        targetCompleted,
        task.taskDate
      )
      .subscribe({

        next: (updatedTask) => {

          Object.assign(
            task,
            updatedTask
          );


          this.showToast(

            targetCompleted
              ? 'Task marked as completed'
              : 'Task marked as incomplete',

            'Undo',

            () =>
              this.restoreSimpleTask(
                task,
                previous
              )

          );

        },

        error: (error) => {

          console.error(
            'Failed to update task:',
            error
          );

          this.loadTasks();

          this.showToast(
            'Could not update task'
          );

        }

      });

  }


  // =====================================================
  // UNDO
  // =====================================================

  private restoreSimpleTask(
    task: Task,
    completed: boolean
  ): void {

    this.taskService
      .updateTask(
        task.id!,
        task.title,
        task.description,
        completed,
        task.taskDate
      )
      .subscribe({

        next: (updatedTask) => {

          Object.assign(
            task,
            updatedTask
          );

          this.loadTasks();

          this.showToast(
            'Task restored'
          );

        },

        error: () => {

          this.loadTasks();

          this.showToast(
            'Could not undo the change'
          );

        }

      });

  }


  private restoreSubtaskStates(
    task: Task,
    states: {
      id: number;
      title: string;
      completed: boolean;
    }[]
  ): void {

    const operations =
      states.map(
        state =>
          this.taskService
            .updateSubTask(
              state.id,
              state.title,
              state.completed
            )
      );


    forkJoin(operations)
      .subscribe({

        next: () => {

          this.loadTasks();

          this.showToast(
            'Task restored'
          );

        },

        error: () => {

          this.loadTasks();

          this.showToast(
            'Could not undo the change'
          );

        }

      });

  }


  // =====================================================
  // MORE TASKS → WEEK VIEW
  // =====================================================

  openMoreTasks(
    date: Date,
    event: MouseEvent
  ): void {

    event.stopPropagation();

    this.currentDate =
      new Date(date);

    this.selectedView =
      'week';

  }


  // =====================================================
  // MODAL CLOSE
  // =====================================================

  closeModal(): void {

    this.modalOpen = false;

    this.modalTaskId = undefined;

    this.modalTitle = '';

    this.modalDescription = '';

    this.modalDate = '';

    this.modalCompleted = false;

    this.modalSubTasks = [];

    this.originalSubTasks = [];

    this.newSubtaskTitle = '';

    this.modalError = '';

    this.saving = false;

    this.openCreateAfterSave = false;

  }


  get isModalValid(): boolean {

    return (

      !!this.modalTitle.trim()

      &&

      !!this.modalDate

      &&

      !this.modalSubTasks.some(
        subTask =>
          !subTask.title.trim()
      )

    );

  }


  // =====================================================
  // TOAST
  // =====================================================

  private showToast(
    message: string,
    actionLabel = '',
    action?: () => void
  ): void {

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }


    this.toastMessage = message;

    this.toastActionLabel =
      actionLabel;

    this.toastAction =
      action ?? null;

    this.toastVisible = true;


    this.toastTimer =
      setTimeout(
        () => this.hideToast(),
        5000
      );

  }


  runToastAction(): void {

    const action =
      this.toastAction;

    this.hideToast();

    if (action) {
      action();
    }

  }


  hideToast(): void {

    this.toastVisible = false;

    this.toastMessage = '';

    this.toastActionLabel = '';

    this.toastAction = null;


    if (this.toastTimer) {

      clearTimeout(
        this.toastTimer
      );

      this.toastTimer = null;

    }

  }

}