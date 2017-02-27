import { Component, OnInit } from '@angular/core';
import { formGroupNameProvider } from '@angular/forms/src/directives/reactive_directives/form_group_name';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

import { AuthService } from './../shared';

@Component({
  selector: 'ang-register-page',
  templateUrl: 'register.component.html'
})
export class RegisterComponent implements OnInit {

  private registerForm: FormGroup;
  private submitted: boolean = false;
  private isLoading: boolean = false;

  private userDepts: any[] = [];
  private userRoles: any[] = [];
  
  constructor(private _auth: AuthService, _fb: FormBuilder) {
    this.registerForm = _fb.group({
      // The first value of this array is the initial value for the control, the second is the
      //  validator for the control. Validators.compose allows you to use multiple validators against a single field
      email: ["corbin@artstor.org", Validators.compose([Validators.required, this.emailValidator])],
      emailConfirm: ["corbin@artstor.org", Validators.required],
      password: ["corbins", Validators.compose([Validators.required, Validators.minLength(7)])],
      passwordConfirm: ["corbins", Validators.required],
      role: [null, Validators.required],
      dept: [null, Validators.required],
      age: [true, Validators.requiredTrue],
      info: true,
      survey: true
    }, { validator: Validators.compose([ this.passwordsEqual, this.emailsEqual ])});
  }

  ngOnInit() {
    // Gets the roles and departments for the select controls
    this._auth.getUserRoles()
      .take(1)
      .subscribe((data) => {
        this.userDepts = data.deptArray;
        this.userRoles = data.roleArray;
      });
  }

  //https://angular.io/docs/ts/latest/api/forms/index/FormGroup-class.html
  /** Validates that the passwords are equal and assigns error if not
   * @returns error to FormGroup called 'mismatch' if the passwords are not equal
   */
  private passwordsEqual(group: FormGroup): any {
    return group.get('password').value === group.get('passwordConfirm').value
      ? null : { passwordMismatch: true };
  }

  /** Validates that the emails are equal and assigns error if not
   * @returns error to FormGroup called 'mismatch' if the emails are not equal
   */
  private emailsEqual(group: FormGroup): any {
    return group.get('email').value === group.get('emailConfirm').value
      ? null : { emailMismatch: true };
  }

  /** Validates email against the same regex used on the server
   * @returns error which should be assigned to the email input
   */
  private emailValidator(control: FormControl): any {
    let emailRe: RegExp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRe.test(control.value) ? null : { 'emailInvalid': true };
  }

  /** Gets called when the registration form is submitted */
  private registerSubmit(formValue: any) {
    this.submitted = true;
    console.log(formValue);

    // this is the object that the service will receive
    let userInfo: any = {
      _method: "update",
      username: formValue.email,
      password: formValue.password,
      role: formValue.role,
      dept: formValue.dept,
      info: formValue.info,
      survey: formValue.survey,
      portal: "library"
    }

    this._auth.registerUser(userInfo)
      .take(1)
      .subscribe((data) => {
        console.log(data);
      }, (error) => {
        console.error(error);
        this._auth.getRegisterError(userInfo)
          .take(1)
          .subscribe((data) => {
            console.log(data);
          }, (err) => {
            console.error(err);
          });
      });

    // if the call is unsuccessful, you will get a 200 w/o a user and with a field called 'statusMessage'
  }
}