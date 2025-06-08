import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MOCK_EMPLOYEES } from '../mock-employees';

export interface Employee {
  employeeId: string;
  pin: string;
  name: string;
  department: string;
  avatar: string;
  allowedProjects: number[];
}



@Injectable({
  providedIn: 'root'
})
export class EmployeeServiceService {


  getEmployees(): Observable<Employee[]> {
    return of(MOCK_EMPLOYEES);
  }
}
