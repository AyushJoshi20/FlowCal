import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { Calendar } from './features/calendar/calendar';

export const routes: Routes = [
      {
    path: 'login',
    component: Login
  },
  {
    path: 'register',
    component: Register
  },
  {
    path : 'calendar',
    component : Calendar
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
