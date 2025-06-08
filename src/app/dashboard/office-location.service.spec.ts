import { TestBed } from '@angular/core/testing';

import { OfficeLocationService } from './office-location.service';

describe('OfficeLocationService', () => {
  let service: OfficeLocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfficeLocationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
