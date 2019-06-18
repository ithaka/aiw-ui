import { Location } from '@angular/common'
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http'
import { RouterModule, Router, ActivatedRoute } from '@angular/router'
import { TestBed, getTestBed, inject, async } from '@angular/core/testing'
import { Idle, DEFAULT_INTERRUPTSOURCES, IdleExpiry } from '@ng-idle/core'
import { PactWeb, Matchers } from '@pact-foundation/pact-web'
import { Angulartics2, ANGULARTICS2_TOKEN, RouterlessTracking } from 'angulartics2'

import { AppConfig } from '../app.service'
import { AuthService } from '_services'

fdescribe('Register form POST /api/secure/register #pact #user-register', () => {

  let provider, _auth, http

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
    http = testbed.get(HttpClient)

  })

  /**
  * Describes '/api/secure/register' endpoint
  */
  describe('/api/secure/register', () => {
    beforeAll((done) => {

      let interactions = []

      interactions.push(
        // Log In
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
        // User info
        provider.addInteraction({
          uponReceiving: 'registration form submission from an already registered user',
          withRequest: {
            method: 'GET',
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
    }) // beforeAll

    afterAll((done) => {
      provider.verify()
        .then(function (a) {
          done()
        }, function (e) {
          console.error(e)
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

