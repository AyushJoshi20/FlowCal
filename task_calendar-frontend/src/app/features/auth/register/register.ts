import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Auth } from '../../../core/services/auth';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  username = '';
  email = '';
  password = '';

  successMessage = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private auth: Auth,
    private router: Router
  ) {}

  register() {

    // Clear previous messages
    this.successMessage = '';
    this.errorMessage = '';

    const user: User = {
      username: this.username.trim(),
      email: this.email.trim(),
      password: this.password
    };

    this.isLoading = true;

    this.auth.register(user).subscribe({

      next: () => {
        this.isLoading = false;

        this.successMessage = 'Account created successfully!';

        // Give the user a moment to see the success message
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },

      error: (error) => {
        this.isLoading = false;

        console.error('Registration failed:', error);

        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      }

    });
  }
}