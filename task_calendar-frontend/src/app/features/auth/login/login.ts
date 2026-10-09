import { Token } from './../../../core/services/token';
import { Component } from '@angular/core';
import { Auth } from '../../../core/services/auth';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';


@Component({
  selector: 'app-login',
  imports: [FormsModule,RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';

  constructor(private auth : Auth,private tokenService : Token,private router : Router){}

  login(){
    this.auth.login(this.email,this.password).subscribe({
      next : (token) => {
        console.log("Login Successful");
        this.tokenService.setToken(token);
        console.log("JWT STORED SUCCESSFULLY");
        this.router.navigate(['/calendar']);
        confirm("Login Successful");
      },
      error:(error)=>{
        console.log("Login failed",error);
      }
    });
  }
}
