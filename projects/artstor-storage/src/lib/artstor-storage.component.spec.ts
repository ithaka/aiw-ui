import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtstorStorageComponent } from './artstor-storage.component';

describe('ArtstorStorageComponent', () => {
  let component: ArtstorStorageComponent;
  let fixture: ComponentFixture<ArtstorStorageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ArtstorStorageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ArtstorStorageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
