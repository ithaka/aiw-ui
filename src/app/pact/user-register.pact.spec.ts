import { HttpClientModule } from '@angular/common/http'
import { RouterModule, Router, ActivatedRoute } from '@angular/router'
import { TestBed, getTestBed, inject, async } from '@angular/core/testing'
import { PactWeb, Matchers } from '@pact-foundation/pact-web'
import { Angulartics2, ANGULARTICS2_TOKEN, RouterlessTracking } from 'angulartics2'
import { FormBuilder, FormGroup } from "@angular/forms"
import { Location } from '@angular/common'
import { AppConfig } from '../app.service'

import { AuthService, } from '../shared'
import { RegisterComponent } from '../register/register.component'

describe('Register form POST /api/secure/register #pact #user-register', () => {

  let provider
  let register: RegisterComponent
  let _authService: AuthService

  beforeAll(function (done) {
    provider = new PactWeb({ consumer: 'aiw-ui', provider: 'artaa_service2', port: 1205 })
    setTimeout(function () { done() }, 2000)
    provider.removeInteractions()
  })

  afterAll(function (done) {
    provider.finalize()
      .then(function () { done() }, function (err) { done.fail(err) })
  })

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [
        //{ provide: AuthService, usevalue: {} },
        { provide: Router, usevalue: {} },
        { provide: ActivatedRoute, usevalue: {} },
        { provide: RouterlessTracking, usevalue: {} },
        { provide: Angulartics2 },
        { provide: FormBuilder },
        { provide: Location , usevalue: {} },
        { provide: AppConfig, usevalue: {} },
        AuthService,
        RegisterComponent
      ],
    })
    const testbed = getTestBed()
    register = testbed.get(RegisterComponent)

  })

  /**
  * Describes '/api/secure/register' endpoint
  */
  describe('/api/secure/register', () => {
    beforeAll((done) => {

      let interactions = []

      interactions.push(
        provider.addInteraction({
          uponReceiving: 'form POST registration form submission',
          withRequest: {
            method: 'POST',
            path: '/api/secure/register',
            headers: { 'Content-type': 'application/x-www-form-urlencoded' },
            body: mockAlreadyRegisteredFormInput
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: registerStatusMessages[0]
          }
        })
      )

      Promise.all(interactions)
        .then(() => { done() })
        .catch((err) => { done.fail(err) })
    })

    afterAll((done) => {
      provider.verify()
        .then(function (a) {
          done()
        }, function (e) {
          done.fail(e)
        })
    })

    it('should return a user success response', (done) => {
      //this.register.registerCall(mockAlreadyRegisteredFormInput)

      this._auth.registerUSer(mockAlreadyRegisteredFormInput)
        .then(res => {
          expect(res).toEqual(registerStatusMessages[0])
          done()
        },
          err => {
            done.fail(err)
          })
      done()
    })
  })

})

interface RegistrationFormBody {
    _method: string,
    username: string,
    password: string,
    role: string,
    dept: string,
    info: string,
    survey: string,
    portal: string
}

// let userInfo: any = {
//   _method: 'update',
//   username: formValue.email.toLowerCase(),
//   password: formValue.password,
//   role: formValue.role,
//   dept: formValue.dept,
//   info: formValue.info,
//   survey: formValue.survey,
//   portal: 'library'
// }

  /**
   * Response Status Messages
   */
interface StatusResponse {
  statusCode: number,
  statusMessage: String
}

let registerStatusMessages: StatusResponse[] = [

  // Scenario : When user email already exists in the portal for which the user is registering
  // or when the email exists in a different portal and the password does not match.
  { statusCode: 1, statusMessage: "User already exists." }
]

// Mock Test Form Inputs
let mockAlreadyRegisteredFormInput: RegistrationFormBody = {
  _method: 'update',
  username: 'brett.fraley@ithaka.org',
  password: 'bretttest',
  role: 'ROLE_OTHER',
  dept: 'DEPT_OTHER',
  info: 'false',
  survey: 'false',
  portal: 'library'
}
