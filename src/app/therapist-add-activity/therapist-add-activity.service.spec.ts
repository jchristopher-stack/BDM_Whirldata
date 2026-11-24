import { TestBed } from '@angular/core/testing';

import { TherapistAddActivityService } from './therapist-add-activity.service';

describe('TherapistAddActivityService', () => {
  let service: TherapistAddActivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TherapistAddActivityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
