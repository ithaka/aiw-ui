import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { formGroupNameProvider } from '@angular/forms/src/directives/reactive_directives/form_group_name'
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms'
import { Angulartics2 } from 'angulartics2'
import { throwError } from 'rxjs'
import { map, take, catchError } from 'rxjs/operators'

// Project Dependencies
import { AuthService, TitleService } from './../_services'
import { USER_ROLES, USER_DEPTS, UserRolesAndDepts } from './user-roles'

@Component({
  selector: 'ang-register-page',
  templateUrl: 'register.component.pug',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  public registerForm: FormGroup
  public submitted: boolean = false
  public isLoading: boolean = false
  // Indicates user is registering for Shibboleth
  public isShibbFlow: boolean = false

  public userDepts: UserRolesAndDepts[] = []
  public userRoles: UserRolesAndDepts[] = []

  public serviceErrors: {
    duplicate?: boolean,
    hasJstor?: boolean,
    hasGoogle?: boolean,
    server?: boolean,
    showShibbolethError?: boolean,
    shibbolethError?: string,
    shibbolethInst?: boolean
  } = {}

  public showJstorModal: boolean = false

  public shibParameters = {
    email: null,
    samlTokenId: null
  }

  // Error codes for shibboleth messages
  private shibErrorCodes: string[] = ['2010', '2020', '2030', '2040', '2050', '2060', '2070', '2080']

  private registerCall: Function

  @ViewChild("registerFormElement", {read: ElementRef}) registerFormElement: ElementRef

  constructor(
    private _auth: AuthService,
    private _router: Router,
    private route: ActivatedRoute,
    private angulartics: Angulartics2,
    private _titleService: TitleService,
    _fb: FormBuilder,
  ) {
    this.registerForm = _fb.group({
      // The first value of this array is the initial value for the control, the second is the
      //  validator for the control. Validators.compose allows you to use multiple validators against a single field
      email: [null,  { validators: [Validators.required, Validators.email, this.emailValidator], updateOn: 'blur' }],
      emailConfirm: [null, Validators.required],
      password: [null, [Validators.required, Validators.minLength(7)]],
      passwordConfirm: [null, Validators.required],
      role: [null, Validators.required],
      dept: [null, Validators.required],
      terms: [false, Validators.requiredTrue],
      info: false,
      survey: false
    }, { validator: [this.passwordsEqual, this.emailsEqual] },
  )
}

  ngOnInit() {

    let email: string = this.route.snapshot.params.email
    let samlTokenId: string = this.route.snapshot.params.samlTokenId
    let type: string = this.route.snapshot.params.type

    setTimeout(() => {
      this.serviceErrors['shibbolethInst'] = this.route.snapshot.params.error === 'INST404'
      this.serviceErrors['user'] = this.route.snapshot.params.error === 'USER404'
    }, 2000)

    if (samlTokenId || type === 'shibboleth') {
      email && this.registerForm.controls.email.setValue(email) // set the email
      this.shibParameters = { email: email, samlTokenId: samlTokenId }
      this.isShibbFlow = true
    }

    // Issues with unauthorized access to the service, and the fact that the data NEVER changes, led us to hardcode these values:
    this.userDepts = USER_DEPTS
    this.userRoles = USER_ROLES

    // If not proxied/IP-authed OR not Shibboleth workflow, redirect to Login
    // If logged in, redirect to Home
    if (!this.isShibbFlow && this._auth.isPublicOnly() || (this._auth.getUser() && this._auth.getUser().isLoggedIn)) {
      this._auth.getUser().isLoggedIn ? this._router.navigate(['/home']) : this._router.navigate(['/login'])
    }

    this._titleService.setSubtitle('Register')
  } // OnInit

  /** Gets called when the registration form is submitted */
  public registerSubmit(formValue: any) {

    this.registerCall = (value) => { return this._auth.registerUser(value) }
    this.serviceErrors = {}
    this.submitted = true

    if (!this.registerForm.valid) { return }
    this.isLoading = true

    // this is the object that the service will receive
    let userInfo: any = {
      _method: 'update',
      username: formValue.email.toLowerCase(),
      password: formValue.password,
      role: formValue.role,
      dept: formValue.dept,
      info: formValue.info,
      survey: formValue.info,
      portal: 'library'
    }

    if (this.shibParameters && this.shibParameters.samlTokenId && this.shibParameters.samlTokenId.length > 0) {
      userInfo.samlTokenId = this.shibParameters.samlTokenId
      this.registerCall = (value) => { return this._auth.registerSamlUser(value) }
    }

    this.registerCall(userInfo).pipe(
      catchError(this.handleError.bind(this)), // Component 'this' needs bound to handleError callback
      take(1),
      map(data => {
        this.handleRegistrationResp(data)
      })).subscribe()

  }

  public announceErrors() {
    setTimeout(() => {
      const errorMessages = this.registerFormElement.nativeElement.querySelectorAll('.has-danger')
      if (errorMessages[0]) {
        errorMessages[0].setAttribute('role', 'alert')
        errorMessages.forEach((msg) => {
          msg.setAttribute('style', 'display: block')
        })
      }
    }, 2000);
  }

  // Catch and handle Error responses from submitted register form
  private handleError(err: any): any {

    if (err.status === 500) {
      this.serviceErrors.server = true
    }
    else if (err.status === 400) {
      if (err.error.code && this.shibErrorCodes.indexOf(err.error.code.toString()) > -1) {
        this.serviceErrors.shibbolethError = err.error.code.toString()
        this.serviceErrors.showShibbolethError = true
      }
    }
    this.isLoading = false
    return throwError(err)
  }

  private handleRegistrationResp(formSubmissionResponse) {

    if (formSubmissionResponse['user']) {
      let user: any = Object.assign({}, formSubmissionResponse['user'])
      // A user that just registered is obviously logged in as a user
      user.isLoggedIn = true
      this._auth.saveUser(formSubmissionResponse['user'])
      this.angulartics.eventTrack.next({ properties: { event: 'remoteLogin', category: 'login', label: 'success' } })
      this.loadForUser(formSubmissionResponse)
    }
    else if (formSubmissionResponse['statusMessage'].includes('JSTOR account exists') && formSubmissionResponse['statusCode'] === 2) {
      // Jstor account exists also returns a status code of 2
      this.serviceErrors.hasJstor = true
    }
    else if (formSubmissionResponse['statusMessage'] === 'User already exists.' && formSubmissionResponse['statusCode'] === 1) {
      this.serviceErrors.duplicate = true
    }
    else if (formSubmissionResponse['statusCode'] === 3 || formSubmissionResponse['statusMessage'].indexOf('registered with Google') >= 0) {
      this.serviceErrors.hasGoogle = true
    }
    this.isLoading = false
  }

  loadForUser(data: any) {
    if (data && data.user) {
      data.user.hasOwnProperty('username') && this.angulartics.setUsername.next(data.user.username)
      data.user.hasOwnProperty('institutionId') && this.angulartics.setUserProperties.next({ institutionId: data.user.institutionId })
      data.user.hasOwnProperty('isLoggedIn') && this.angulartics.setUserProperties.next({ isLoggedIn: data.user.isLoggedIn })
      data.user.hasOwnProperty('shibbolethUser') && this.angulartics.setUserProperties.next({ shibbolethUser: data.user.shibbolethUser })
      data.user.hasOwnProperty('dept') && this.angulartics.setUserProperties.next({ dept: data.user.dept })
      data.user.hasOwnProperty('ssEnabled') && this.angulartics.setUserProperties.next({ ssEnabled: data.user.ssEnabled })

      data.user.isLoggedIn = true
      this._auth.saveUser(data.user)
      if (this._auth.getFromStorage('stashedRoute')) {
        this._router.navigateByUrl(this._auth.getFromStorage('stashedRoute'))
        this._auth.deleteFromStorage('stashedRoute')
      } else {
        this._router.navigate(['/home'])
      }
    }
  }

  /**
   * Navigates to correct page for login depending on whether or not shiboleth params exist
   */
  public navigateToLogin(): void {
    if (this.shibParameters && (this.shibParameters.email || this.shibParameters.samlTokenId)) {
      this._router.navigate(['/link', this.shibParameters])
    } else {
      this._router.navigate(['/login'])
    }
  }

  // https://angular.io/docs/ts/latest/api/forms/index/FormGroup-class.html
  /** Validates that the passwords are equal and assigns error if not
   * @returns error to FormGroup called 'mismatch' if the passwords are not equal
   */
  private passwordsEqual(group: FormGroup): any {
    return group.get('password').value === group.get('passwordConfirm').value
      ? null : { passwordMismatch: true }
  }

  /** Validates that the emails are equal and assigns error if not
   * @returns error to FormGroup called 'mismatch' if the emails are not equal
   */
  private emailsEqual(group: FormGroup): any {
    return group.get('email').value === group.get('emailConfirm').value
      ? null : { emailMismatch: true }
  }

  /** Validates email against the same regex used on the server
   * @returns error which should be assigned to the email input
   */
  private emailValidator(control: FormControl): any {
    let emailRe: RegExp = /^\w+([\+\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,30})+$/
    return emailRe.test(control.value) ? null : { emailInvalid: true }
  }

  /**
   * Closes JSTOR modal
   */
  private closeJstorModal(command) {
    // Hide modal
    this.showJstorModal = false
  }
}
