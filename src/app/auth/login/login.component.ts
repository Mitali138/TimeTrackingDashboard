import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Employee, EmployeeServiceService } from './employee-service.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  animations: [
    trigger('transitionMessages', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class LoginComponent implements OnInit {
  hide = true;
  failedAttempts = 0;
  lockout = false;
  lockoutSeconds = 30;
  errorMessage = '';
  employees: Employee[] = [];
  employee?: Employee;



  private fb = inject(FormBuilder);
  private router = inject(Router);
  private employeeService = inject(EmployeeServiceService);

  loginForm = this.fb.group({
    employeeId: ['', [Validators.required, Validators.pattern(/^EMP\d{3}$/)]],
    pin: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
    rememberMe: [false]
  });
  ngOnInit() {

    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('employee') || localStorage.getItem('employee');
      if (stored) {
        this.employee = JSON.parse(stored);
      }
    }
  }

  get employeeId() {
    return this.loginForm.get('employeeId')!;
  }

  get pin() {
    return this.loginForm.get('pin')!;
  }

  toggleVisibility() {
    this.hide = !this.hide;
  }

  onSubmit() {
    const { employeeId, pin, rememberMe } = this.loginForm.value;


    this.employeeService.getEmployees().subscribe(data => {
      this.employees = data;
    });
    const employee = this.employees.find(
      e => e.employeeId === employeeId && e.pin === pin
    );

    if (employee) {
      if (typeof window !== 'undefined') {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('employee', JSON.stringify(employee));
      }
      this.router.navigate(['/dashboard'], {
        state: { employee }
      });
    } else {
      this.failedAttempts++;
      this.errorMessage = 'Invalid Employee ID or PIN';
      this.pin?.reset();

      if (this.failedAttempts >= 3) {
        this.lockout = true;
        const interval = setInterval(() => {
          this.lockoutSeconds--;
          if (this.lockoutSeconds <= 0) {
            clearInterval(interval);
            this.lockout = false;
            this.failedAttempts = 0;
            this.lockoutSeconds = 30;
          }
        }, 1000);
      }
    }
  }
}