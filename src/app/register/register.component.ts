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
      email: [null, Validators.compose([Validators.required, this.emailValidator])],
      emailConfirm: [null, Validators.required],
      password: [null, Validators.compose([Validators.required, Validators.minLength(7)])],
      passwordConfirm: [null, Validators.required]
    });
  }

  ngOnInit() { }

  //https://angular.io/docs/ts/latest/api/forms/index/FormGroup-class.html
  /** Validates that the passwords are equal and assigns error if not
   * @returns error to FormGroup called 'mismatch' if the passwords are not equal
   */
  private passwordsEqual(group: FormGroup): any {
    return group.get('password').value === group.get('passwordConfirm').value
      ? null : { mismatch: true };
  }

  /** Validates email against the same regex used on the server
   * @returns error which should be assigned to the email input
   */
  private emailValidator(control: FormControl): any {
    let emailRe: RegExp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRe.test(control.value) ? null : { 'emailIncorrect': true };
  }

  /** Gets called when the registration form is submitted */
  private registerSubmit(formValue: any) {

  }
}