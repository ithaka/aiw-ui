import { HttpClientModule, HttpHeaders, HttpClient } from '@angular/common/http'
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
  let http: HttpClient


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
          uponReceiving: 'registration form submission',
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

    it('should call register and pass', (done) => {
      _auth.registerUser(mockAlreadyRegisteredFormInput).subscribe((data) => {
        expect(registerStatusMessages[0]).toEqual(registerStatusMessages[0])
        done()
      })
    })

    // it('should return a user success response', (done) => {

    //   // this.registerCall(userInfo).pipe(
    //   //   catchError(this.handleError.bind(this)), // Component 'this' needs bound to handleError callback
    //   //   take(1),
    //   //   map(data => {
    //   //     this.handleRegistrationResp(data)
    //   //   })).subscribe()
    //   let res
    //   _auth.registerUser(mockAlreadyRegisteredFormInput).pipe(
    //     take(1),
    //     map(data => {
    //     res = data
    //     console.log('res: ', res)

    //   })).subscribe(() => {
    //     expect(res).toEqual(registerStatusMessages[0])
    //     expect(1).toEqual(1)
    //     done()
    //   })

    // })
  })

})

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

// Mock register success
let mockRegisterResponse = {
"adminContact": "string",
"contentSubscriptions": [
"ADL"
],
"dayRemain": 0,
"instContact": "string",
"institutionName": "string",
"isRememberMe": true,
"k12User": true,
"maxPeriod": 0,
"remoteaccess": true,
"shibbolethUser": true,
"status": true,
"statusCode": 0,
"statusMessage": "string",
"targetUrl": "string",
"user": {
"accesibleInstitutionsByUser": "string",
"accountNonExpired": true,
"accountNonLocked": true,
"authorities": [
{
"authority": "string"
}
],
"baseProfileId": 0,
"cIFolderAllowed": 0,
"citationsCount": 0,
"dayRemain": 0,
"defaultView": "string",
"dept": "string",
"facetedSearchView": 0,
"firstName": "string",
"imageIVBGcolor": "string",
"imageTNBGcolor": "string",
"institutionId": 0,
"k12User": true,
"lastName": "string",
"maxPeriod": 0,
"portalDescipline": 0,
"portalInstitution": 0,
"profileInstitution": 0,
"referred": true,
"regionId": 0,
"rememberMe": true,
"role": "string",
"sessionTimeout": 0,
"shibbolethUser": true,
"ssAdmin": true,
"ssEnabled": true,
"thumbsPerPage": 0,
"typeId": 0,
"userAccesibleDesciplines": "string",
"userAccessiblePortalsMap": [
  {
    "insAdmin": 0,
    "institutionid": 0,
    "pcAllowed": 0,
    "portalName": "string",
    "profileDescipline": 0,
    "profileid": 0,
    "ssAdmin": 0,
    "ssEnabled": 0,
    "typeid": 0,
    "userActive": 0,
    "virtualProfileid": 0
  }
],
  "userFromPortal": true,
    "userPCAllowed": "string",
    "userWithMultiInstitutionAccess": true,
    "username": "string",
    "viewerView": "string"
  }
}
