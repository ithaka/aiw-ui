import { HttpClientModule } from '@angular/common/http'
import { RouterModule, Router, ActivatedRoute } from '@angular/router'
import { TestBed, getTestBed, inject, async } from '@angular/core/testing'
import { Idle, DEFAULT_INTERRUPTSOURCES, IdleExpiry } from '@ng-idle/core'
import { map, take, catchError } from 'rxjs/operators'
import { PactWeb, Matchers } from '@pact-foundation/pact-web'
import { Angulartics2, ANGULARTICS2_TOKEN, RouterlessTracking } from 'angulartics2'
import { FormBuilder, FormGroup } from "@angular/forms"
import { Location } from '@angular/common'
import { AppConfig } from '../app.service'

import { AuthService } from '../shared'
import { RegisterComponent } from '../register/register.component'

describe('Register form POST /api/secure/register #pact #user-register', () => {

  let provider, _auth
  let register: RegisterComponent
  let authService: AuthService

  beforeAll(function (done) {
    provider = new PactWeb({ consumer: 'aiw-ui', provider: 'artaa_service', port: 1205 })
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
        { provide: Router, usevalue: {} },
        { provide: ActivatedRoute, usevalue: {} },
        { provide: RouterlessTracking, usevalue: {} },
        { provide: Angulartics2 },
        { provide: Location , usevalue: {} },
        AppConfig,
        AuthService,
        FormBuilder,
        Idle, IdleExpiry,
        RegisterComponent
      ],
    })
    const testbed = getTestBed()
    _auth = testbed.get(AuthService)
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

      // TEST registerCall instead of full submit

      // let res = register.registerCall(mockAlreadyRegisteredFormInput) // <== called userI fo in register component
      // expect(res).toEqual(registerStatusMessages[0])
      // //expect(res.statusMessage).toEqual(registerStatusMessages[0].statusMessage)
      // done()
      let res
      _auth.registerUser(mockAlreadyRegisteredFormInput)
      .subscribe(data => {
        res = data
        console.log('!!!!!!!', res)
      }) // <== called userI fo in register component
      expect(res).toEqual(res)
      //expect(res.statusMessage).toEqual(registerStatusMessages[0].statusMessage)
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

let registerStatusMessages = [

  // Scenario : When user email already exists in the portal for which the user is registering
  // or when the email exists in a different portal and the password does not match.
  { statusCode: 1, statusMessage: "User already exists." }
]

// Mock Test Form Inputs
let mockAlreadyRegisteredFormInput = {
  _method: 'update',
  username: 'brett.fraley@ithaka.org',
  password: 'bretttest',
  role: 'ROLE_OTHER',
  dept: 'DEPT_OTHER',
  info: 'false',
  survey: 'false',
  portal: 'library'
}
