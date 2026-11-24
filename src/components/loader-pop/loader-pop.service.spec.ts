import { TestBed } from '@angular/core/testing';

import { LoaderPopService } from './loader-pop.service';

describe('LoaderPopService', () => {
  let service: LoaderPopService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoaderPopService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
