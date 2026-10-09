export interface SubTask {
  id?: number;
  title: string;
  completed: boolean;
}

export interface Task {
  id?: number;
  title: string;
  description: string;
  taskDate: string;
  completed: boolean;
  subTasks: SubTask[];
}