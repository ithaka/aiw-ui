import { Component, OnInit } from '@angular/core';
import { formGroupNameProvider } from '@angular/forms/src/directives/reactive_directives/form_group_name';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'ang-register-page',
  templateUrl: 'register.component.html'
})
export class RegisterComponent implements OnInit {

  private registerForm: FormGroup;
  
  constructor(_fb: FormBuilder) {
    this.registerForm = _fb.group({
      email: [null, Validators.required],
      emailConfirm: [null, Validators.required],
      password: [null, Validators.required],
      passwordConfirm: [null, Validators.required]
    });
  }

  ngOnInit() { }

  /** Gets called when the registration form is submitted */
  private registerSubmit(formValue: any) {

  }
}