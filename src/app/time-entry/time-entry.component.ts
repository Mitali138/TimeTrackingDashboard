import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormsModule, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatCard } from '@angular/material/card';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';
interface TimeEntry {
  project: string;
  startTime: string;
  endTime: string;
  duration?: string;
}
@Component({
  selector: 'app-time-entry',
  standalone: true,
  imports: [MatFormFieldModule, CommonModule, MatSelectModule, MatButtonModule, MatIconModule, MatInputModule, FormsModule, ReactiveFormsModule, MatCard, DragDropModule],
  templateUrl: './time-entry.component.html',
  styleUrls: ['./time-entry.component.scss'],
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
  ]
})
export class TimeEntryComponent implements OnInit {
  form: FormGroup;
  projects = [
    { id: 1, name: 'Website Redesign' },
    { id: 2, name: 'Mobile App Development' },
    { id: 3, name: 'Internal Training' },
    { id: 4, name: 'Client Meetings' },
    { id: 5, name: 'Code Review' },
    { id: 6, name: 'Documentation' },
    { id: 7, name: 'Bug Fixes' }
  ];
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);


  constructor() {
    this.form = this.fb.group({
      entries: this.fb.array([], this.validateEntries)
    });
  }
  drop(event: CdkDragDrop<string[]>): void {
    const entriesArray = this.entries.controls;
    moveItemInArray(entriesArray, event.previousIndex, event.currentIndex);
    this.entries.setValue(entriesArray.map(c => c.value));
  }
  ngOnInit(): void {
    this.loadFromLocalStorage();
    setInterval(() => {
      this.saveToLocalStorage();
    }, 30000);
  }
  saveToLocalStorage(): void {
    localStorage.setItem('timeEntries', JSON.stringify(this.form.value.entries));
  }

  loadFromLocalStorage(): void {
    const savedEntries = localStorage.getItem('timeEntries');
    if (savedEntries) {
      const parsed = JSON.parse(savedEntries);
      if (Array.isArray(parsed)) {
        parsed.forEach((entry: TimeEntry) => {
          this.entries.push(this.fb.group({
            project: [entry.project, Validators.required],
            startTime: [entry.startTime, Validators.required],
            endTime: [entry.endTime, Validators.required],
            duration: [{ value: entry.duration || '', disabled: true }]
          }));
        });
      }
    }
  }
  getWeeklySummary() {
    const summary: Record<string, number> = {};

    this.entries.controls.forEach(control => {
      const project = control.get('project')?.value;
      const durationStr = control.get('duration')?.value;
      if (project && durationStr && durationStr !== 'Invalid') {
        const [hrsPart, minsPart] = durationStr.split(' ');
        const hrs = parseInt(hrsPart.replace('h', ''), 10);
        const mins = parseInt(minsPart.replace('m', ''), 10);
        const totalMins = hrs * 60 + mins;

        if (!summary[project]) summary[project] = 0;
        summary[project] += totalMins;
      }
    });

    return summary;
  }
  validateEntries(formArray: AbstractControl): ValidationErrors | null {
    const entries = formArray.value;
    const now = new Date();

    for (let i = 0; i < entries.length; i++) {
      const startI = new Date(`2000-01-01T${entries[i].startTime}`);
      const endI = new Date(`2000-01-01T${entries[i].endTime}`);

      const formatTime = (date: Date) =>
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (startI > now || endI > now) {
        return {
          futureTime: `Future time: Cannot log time beyond current time (${formatTime(now)})`,
        };
      }

      if (endI <= startI) {
        return {
          invalidDuration: 'Invalid duration: End time must be after start time',
        };
      }

      for (let j = i + 1; j < entries.length; j++) {
        const startJ = new Date(`2000-01-01T${entries[j].startTime}`);
        const endJ = new Date(`2000-01-01T${entries[j].endTime}`);

        const overlap = startI < endJ && startJ < endI;
        if (overlap) {
          return {
            overlapping: `Time overlap: You already have an entry from ${formatTime(
              startJ
            )} to ${formatTime(endJ)}`,
          };
        }
      }
    }

    const totalMillis = entries.reduce((sum: number, entry: TimeEntry) => {
      const start = new Date(`2000-01-01T${entry.startTime}`);
      const end = new Date(`2000-01-01T${entry.endTime}`);
      return sum + (end.getTime() - start.getTime());
    }, 0);

    const totalHours = totalMillis / (1000 * 60 * 60);
    if (totalHours > 16) {
      return {
        dailyLimit: 'Daily limit: Total hours for the day cannot exceed 16',
      };
    }

    return null;
  }


  get entries(): FormArray {
    return this.form.get('entries') as FormArray;
  }

  addEntry(): void {
    this.entries.push(this.fb.group({
      project: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      duration: [{ value: '', disabled: true }]
    }));
  }

  removeEntry(index: number): void {
    confirm('Are you sure you want to delete data');
    this.entries.removeAt(index);
  }

  calculateDuration(i: number): void {
    const entry = this.entries.at(i);
    const start = entry.get('startTime')?.value;
    const end = entry.get('endTime')?.value;

    if (start && end) {
      const startTime = new Date(`2000-01-01T${start}`);
      const endTime = new Date(`2000-01-01T${end}`);

      if (endTime <= startTime) {
        entry.get('duration')?.setValue('Invalid');
        return;
      }

      const diffMs = endTime.getTime() - startTime.getTime();
      const mins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(mins / 60);
      const minsLeft = mins % 60;

      entry.get('duration')?.setValue(`${hrs}h ${minsLeft}m`);
    }
  }
  pageSize = 5;
  currentPage = 0;

  get pagedEntries(): AbstractControl[] {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.entries.controls.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.entries.controls.length / this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  onSubmit() {
    if (this.form.valid) {
      alert('Are you sure you want to save');
    } else {
      const control = this.form.get('entries');
      if (control) {
        const validationErrors = this.validateEntries(control);
        if (validationErrors) {
          const message = Object.values(validationErrors)[0];
          this.snackBar.open(message as string, 'Close', {
            duration: 5000,
            verticalPosition: 'top',
          });
          return;
        }
      }

    }
  }
}

