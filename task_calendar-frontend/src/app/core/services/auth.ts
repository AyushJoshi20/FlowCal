import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { User } from '../../shared/models/user.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http : HttpClient){}

    register(user: User): Observable<User> {
    return this.http.post<User>(
      `${this.apiUrl}/register`,
      user
    );
  }

  login(email: string, password: string): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/login`,
      {
        email,
        password
      },
      {
        responseType: 'text'
      }
    );
  }
}
