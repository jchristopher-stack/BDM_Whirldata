import { TestBed } from '@angular/core/testing';

import { MessagePopService } from './message-pop.service';

describe('MessagePopService', () => {
  let service: MessagePopService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessagePopService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
