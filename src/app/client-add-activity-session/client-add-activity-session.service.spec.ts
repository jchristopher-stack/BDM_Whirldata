import { TestBed } from '@angular/core/testing';

import { ClientAddActivitySessionService } from './client-add-activity-session.service';

describe('ClientAddActivitySessionService', () => {
  let service: ClientAddActivitySessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientAddActivitySessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
