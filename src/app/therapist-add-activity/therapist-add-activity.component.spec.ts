import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TherapistAddActivityComponent } from './therapist-add-activity.component';

describe('TherapistAddActivityComponent', () => {
  let component: TherapistAddActivityComponent;
  let fixture: ComponentFixture<TherapistAddActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TherapistAddActivityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TherapistAddActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
