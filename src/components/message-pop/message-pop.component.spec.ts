import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagePopComponent } from './message-pop.component';

describe('MessagePopComponent', () => {
  let component: MessagePopComponent;
  let fixture: ComponentFixture<MessagePopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessagePopComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagePopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
