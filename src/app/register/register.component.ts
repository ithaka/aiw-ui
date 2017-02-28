import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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

  private serviceErrors: {
    duplicate?: boolean
  } = {};
  
  constructor(private _auth: AuthService, private _router: Router, _fb: FormBuilder) {
    this.registerForm = _fb.group({
      // The first value of this array is the initial value for the control, the second is the
      //  validator for the control. Validators.compose allows you to use multiple validators against a single field
      email: [null, Validators.compose([Validators.required, this.emailValidator])],
      emailConfirm: [null, Validators.required],
      password: [null, Validators.minLength(7)],
      passwordConfirm: [null, Validators.required],
      role: [null, Validators.required],
      dept: [null, Validators.required],
      age: [true, Validators.requiredTrue],
      info: true,
      survey: true
    }, { validator: Validators.compose([ this.passwordsEqual, this.emailsEqual ])});
  }

  ngOnInit() {
    if (this._auth.getUser && this._auth.getUser().isLoggedIn) {
      this._router.navigate(['/home']);
    }

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
    this.serviceErrors = {};
    this.submitted = true;

    if (!this.registerForm.valid) { return; }
    this.isLoading = true;

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
        this.isLoading = false;
        if (data.user) {
          let user: any;
          Object.assign(user, data.user);
          user.isLoggedIn = true;
          this._auth.saveUser(data.user);
          this._router.navigate(['/home']);
        } else {
          if (data.statusMessage === "User already exist") {
            this.serviceErrors.duplicate = true;
          }
        }
      }, (error) => {
        console.error(error);
      });

    // if the call is unsuccessful, you will get a 200 w/o a user and with a field called 'statusMessage'
  }
}