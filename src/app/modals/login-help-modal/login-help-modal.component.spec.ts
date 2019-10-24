import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginHelpModal } from './login-help-modal.component';

describe('LoginHelpModal', () => {
  let component: LoginHelpModal;
  let fixture: ComponentFixture<LoginHelpModal>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoginHelpModal ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginHelpModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
