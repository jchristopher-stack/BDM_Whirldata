import { TestBed } from '@angular/core/testing';

import { TherapistHomeService } from './therapist-home.service';

describe('TherapistHomeService', () => {
  let service: TherapistHomeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TherapistHomeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
