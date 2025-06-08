import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { OFFICE_LOCATIONS } from './home/office-locations';

export interface OfficeLocation {
  name: string;
  latitude: number | null;
  longitude: number | null;
  radius?: number;
}



@Injectable({
  providedIn: 'root'
})
export class OfficeLocationService {


  getOfficeLocation(): Observable<OfficeLocation[]> {
    return of(OFFICE_LOCATIONS);
  }

}
