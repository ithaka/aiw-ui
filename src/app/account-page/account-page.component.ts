import { Subscription } from 'rxjs/Rx';
import { Component, OnInit } from '@angular/core';
import { formGroupNameProvider } from '@angular/forms/src/directives/reactive_directives/form_group_name';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

// Project Dependencies
import { AuthService } from '../shared';

@Component({
  selector: 'app-account-page',
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.scss']
})
export class AccountPage implements OnInit {
  private user: any = {};
  private institutionObj: any = {};
  private subscriptions: Subscription[] = [];
  private changePassLoading: boolean = false;

  private passForm: FormGroup;
  private submitted: boolean = false;

  constructor(private _auth: AuthService, _fb: FormBuilder) {
    this.passForm = _fb.group({
      oldPass: [null, Validators.required],
      newPass: [null, Validators.compose([Validators.required, Validators.minLength(7)])],
      newPassConfirm: [null, Validators.required]
    }, { validator: this.passwordsEqual });
  }

  ngOnInit() {
    this.user = this._auth.getUser();

    this.subscriptions.push(
      this._auth.getInstitution().subscribe((institutionObj) => {
        this.institutionObj = institutionObj;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /** Validates that the passwords are equal and assigns error if not
   * @returns error to FormGroup called 'mismatch' if the passwords are not equal
   */
  private passwordsEqual(group: FormGroup): any {
    return group.get('newPass').value === group.get('newPassConfirm').value
      ? null : { passwordMismatch: true };
  }

  private changePass(formValue: any): void {
    console.log(formValue);
    this.submitted = true;

    // don't call the service if the form isn't valid
    if ( !this.passForm.valid ) { return; }

    this.changePassLoading = true;

    this._auth.changePassword(formValue.oldPass, formValue.newPass)
      .take(1)
      .subscribe((res) => {
        this.changePassLoading = false;
        console.log(res);
      }, (err) => {
        this.changePassLoading = false;
        console.error(err);
      });


  }

}