import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtstorGoogleSlidesComponent } from './artstor-google-slides.component';

describe('ArtstorGoogleSlidesComponent', () => {
  let component: ArtstorGoogleSlidesComponent;
  let fixture: ComponentFixture<ArtstorGoogleSlidesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArtstorGoogleSlidesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArtstorGoogleSlidesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
