import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientAddActivitySessionComponent } from './client-add-activity-session.component';

describe('ClientAddActivitySessionComponent', () => {
  let component: ClientAddActivitySessionComponent;
  let fixture: ComponentFixture<ClientAddActivitySessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClientAddActivitySessionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientAddActivitySessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
