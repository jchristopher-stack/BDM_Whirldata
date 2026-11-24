import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoaderPopComponent } from './loader-pop.component';

describe('LoaderPopComponent', () => {
  let component: LoaderPopComponent;
  let fixture: ComponentFixture<LoaderPopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoaderPopComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoaderPopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
