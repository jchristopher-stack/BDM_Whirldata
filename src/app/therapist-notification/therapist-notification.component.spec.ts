import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TherapistNotificationComponent } from './therapist-notification.component';

describe('TherapistNotificationComponent', () => {
  let component: TherapistNotificationComponent;
  let fixture: ComponentFixture<TherapistNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TherapistNotificationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TherapistNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
