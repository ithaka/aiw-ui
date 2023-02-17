import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { Router, ActivatedRoute } from '@angular/router'
import { AuthService } from '_services'
import { map, take } from 'rxjs/operators'


@Component({
  selector: 'ang-password-reset',
  templateUrl: 'password-reset.component.pug'
})

export class PasswordReset implements OnInit {

  public resetForm: FormGroup
  public passwordResetParams: {
    email: string,
    signature: string,
  }
  public serviceResponses: {
    success?: boolean,
    wrongPass?: boolean,
    generalError?: boolean
  } = {};
  public submitted: boolean = false
  public resetPassLoading: boolean = false
  public invalidSignature: boolean = false

  constructor(
    _fb: FormBuilder,
    private route: ActivatedRoute,
    private _auth: AuthService,
    private _router: Router
  ) {
    this.resetForm = _fb.group({
      newPass: [null, Validators.compose([Validators.required, Validators.minLength(7)])],
      newPassConfirm: [null, Validators.required]
    }, { validator: this.passwordsEqual })
  }

  ngOnInit() {
    if (!this.route.snapshot.params.signature) {
      this._router.navigate(['/login'])
    }

    console.log(this.route.snapshot)
    this.passwordResetParams = {
      signature: this.route.snapshot.params.signature,
      email: this.route.snapshot.params.email
    }

    this._auth.validateSignature(this.passwordResetParams.email, this.passwordResetParams.signature).then( res => {
      if (res.body !== true) {
        this.invalidSignature = true
      }
    })
  }

  submit() {

  }

  public resetPass(formValue: any): void {
    this.submitted = true;
    this.serviceResponses = {};

    // don't call the service if the form isn't valid
    if ( !this.resetForm.valid ) { return; }

    this.resetPassLoading = true;

    this._auth.resetPassword(this.passwordResetParams.email, formValue.newPass, this.passwordResetParams.signature)
      .then(res => {
        this.resetPassLoading = false;

        switch (res.statusCode) {
          case 0: this.serviceResponses.success = true; break;
          case 6: this.serviceResponses.wrongPass = true; break;
          default: this.serviceResponses.generalError = true;
        }
        
        this._router.navigate(['/login'])
      })
      .catch(err => {
        this.resetPassLoading = false;
        this.serviceResponses.generalError = true;
        console.error(err);
      })
  }


  /** Validates that the passwords are equal and assigns error if not
   * @returns error to FormGroup called 'mismatch' if the passwords are not equal
   */
  private passwordsEqual(group: FormGroup): any {
    return group.get('newPass').value === group.get('newPassConfirm').value
      ? null : { passwordMismatch: true };
  }
}
