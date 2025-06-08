import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { TimeEntryComponent } from '../../time-entry/time-entry.component';
import { OfficeLocation, OfficeLocationService } from '../office-location.service';

interface Employee {
  employeeId: string;
  name: string;
  pin: string;
  department: string;
  allowedProjects: number[];
  avatar?: string;
}
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTabsModule, MatCardModule, TimeEntryComponent],
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  employee!: Employee;
  currentDate = new Date();
  officeLocation: OfficeLocation[] = [];
  notificationsEnabled = false;
  notificationIntervalId!: ReturnType<typeof setInterval>;
  intervalId!: ReturnType<typeof setInterval>;
  timerInterval!: ReturnType<typeof setInterval>;

  clockedIn = false;

  currentLocation = 'Unknown';

  currentTime = '';
  clockInTime = '';
  elapsedTime = '00:00:00';
  status = '🔴 Not Clocked In';
  notifications = false;


  router = inject(Router);
  officeLocationService = inject(OfficeLocationService);



  ngOnInit() {
    if (typeof window !== 'undefined') {
      const emp = sessionStorage.getItem('employee') || localStorage.getItem('employee');
      if (!emp) {
        this.router.navigate(['/auth']);
        return;
      }

      this.employee = JSON.parse(emp);

      this.startClock();

      const storedPref = localStorage.getItem('notificationsEnabled');
      this.notificationsEnabled = storedPref === 'true';

      if (Notification.permission !== 'granted') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            this.notificationsEnabled = true;
            localStorage.setItem('notificationsEnabled', 'true');
          }
        });
      }
    } else {
      this.router.navigate(['/auth']);
    }
  }



  ngOnDestroy() {
    clearInterval(this.intervalId);
    clearInterval(this.timerInterval);
  }

  startClock() {
    this.updateTime();
    this.intervalId = setInterval(() => this.updateTime(), 1000);
  }

  updateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString();
    this.currentDate = now;
  }

  clockIn() {
    this.startTimer();
    if (this.notificationsEnabled && Notification.permission === 'granted') {
      this.startNotificationReminder();
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        const found = this.checkOfficeLocation(latitude, longitude);
        this.currentLocation = found.name;
        this.clockedIn = true;
        const now = new Date();
        this.clockInTime = now.toLocaleTimeString();
        this.status = '🟢 Clocked In';
        this.startTimer();
      },
      () => {
        alert('Location permission denied. Marking as Work from Home.');
        this.currentLocation = 'Remote';
        this.clockedIn = true;
        this.clockInTime = new Date().toLocaleTimeString();
        this.status = '🟢 Clocked In';
        this.startTimer();
      }
    );
  }
  startNotificationReminder() {
    this.notificationIntervalId = setInterval(() => {
      new Notification('Work Reminder', {
        body: "You've been working for 2 hours. Stay hydrated!",
        icon: '/assets/notification-icon.png'
      });
    }, 2 * 60 * 60 * 1000);
  }


  checkOfficeLocation(lat: number, lon: number) {
    this.officeLocationService.getOfficeLocation().subscribe(data => {
      this.officeLocation = data;
    });

    for (const office of this.officeLocation) {
      if (office.latitude && office.longitude && office.radius != null) {
        const dist = this.getDistance(lat, lon, office.latitude, office.longitude);
        if (dist <= office.radius) return office;
      }
    }
    return { name: 'Remote' };

  }

  getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3;
    const φ1 = lat1 * (Math.PI / 180);
    const φ2 = lat2 * (Math.PI / 180);
    const Δφ = (lat2 - lat1) * (Math.PI / 180);
    const Δλ = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  startTimer() {
    const start = new Date();
    this.timerInterval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - start.getTime();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      this.elapsedTime = `${this.pad(hrs)}:${this.pad(mins)}:${this.pad(secs)}`;
    }, 1000);
  }

  pad(n: number): string {
    return n < 10 ? '0' + n : n.toString();
  }

  clockOut() {
    if (confirm('Are you sure you want to clock out?')) {
      clearInterval(this.timerInterval);
      clearInterval(this.notificationIntervalId);
      this.status = '🔴 Not Clocked In';
      this.clockedIn = false;
      alert(`Clocked out. Total worked: ${this.elapsedTime}`);
      this.elapsedTime = '00:00:00';
    }
  }

  logout() {
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.removeItem('employee');
      }
      this.router.navigate(['/auth']);
    }
  }
  toggleNotifications() {
    this.notificationsEnabled = !this.notificationsEnabled;
    localStorage.setItem('notificationsEnabled', String(this.notificationsEnabled));

    if (this.notificationsEnabled && Notification.permission !== 'granted') {
      Notification.requestPermission().then((perm) => {
        if (perm !== 'granted') {
          this.notificationsEnabled = false;
          localStorage.setItem('notificationsEnabled', 'false');
          alert('Browser denied notification permissions.');
        }
      });
    }
  }

}
