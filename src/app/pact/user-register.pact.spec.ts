import { Location } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { RouterModule, Router, ActivatedRoute } from '@angular/router'
import { TestBed, getTestBed, inject, async } from '@angular/core/testing'
import { Idle, DEFAULT_INTERRUPTSOURCES, IdleExpiry } from '@ng-idle/core'
import { PactWeb, Matchers } from '@pact-foundation/pact-web'
import { Angulartics2, ANGULARTICS2_TOKEN, RouterlessTracking } from 'angulartics2'

import { AppConfig } from '../app.service'
import { AuthService } from '../shared'

fdescribe('Register form POST /api/secure/register #pact #user-register', () => {

  let provider, _auth

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
        Idle, IdleExpiry
      ],
    })
    const testbed = getTestBed()
    _auth = testbed.get(AuthService)

  })

  /**
  * Describes '/api/secure/register' endpoint
  */
  describe('/api/secure/register', () => {
    beforeAll((done) => {

      let interactions = []

      interactions.push(
        // Registration Success
        provider.addInteraction({
          uponReceiving: 'registration form submission from a new user',
          withRequest: {
            method: 'POST',
            path: '/api/secure/register',
            headers: { 'Content-type': 'application/x-www-form-urlencoded' },
            body: mockRegisterFormInput
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: mockRegistrationResponses[0]
          }
        }),
        // Already Registered
        provider.addInteraction({
          uponReceiving: 'registration form submission from an already registered user',
          withRequest: {
            method: 'POST',
            path: '/api/secure/register',
            headers: { 'Content-type': 'application/x-www-form-urlencoded' },
            body: mockAlreadyRegisteredFormInput
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: mockRegistrationResponses[1]
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

    // Test successful registration response
    it('should return a successful registration response', (done) => {
      _auth.registerUser(mockRegisterFormInput).subscribe((data) => {
        expect(data).toEqual(mockRegistrationResponses[0])
        done()
      })
    })

    // Tests already registered service response
    it('should return already registered status message', (done) => {
      _auth.registerUser(mockAlreadyRegisteredFormInput).subscribe((data) => {
        expect(data).toEqual(mockRegistrationResponses[1])
        done()
      })
    })

  })

})

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

let mockRegisterFormInput = {
  _method: 'update',
  username: 'ithakaqa_artstor-03@artstor.org',
  password: '1234567',
  role: 'ROLE_CU_GRAD_STUDENT',
  dept: 'DEPT_ARCHAEO',
  info: 'false',
  survey: 'false',
  portal: 'library'
}

let mockRegistrationResponses = [

  // Mock successful registration response, from auth swagger docs
  {
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
  },

  // Scenario : When user email already exists in the portal for which the user is registering
  // or when the email exists in a different portal and the password does not match.
  { statusCode: 1, statusMessage: "User already exists." }

]
