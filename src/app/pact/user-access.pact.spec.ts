import { Location } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { RouterModule, Router, ActivatedRoute } from '@angular/router'
import { TestBed, getTestBed, inject, async } from '@angular/core/testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { Idle, DEFAULT_INTERRUPTSOURCES, IdleExpiry } from '@ng-idle/core'
import { PactWeb, Matchers } from '@pact-foundation/pact-web'
import { Angulartics2, ANGULARTICS2_TOKEN, RouterlessTracking } from 'angulartics2'

import { AppConfig } from '../app.service'
import { AuthService } from '_services'

fdescribe('Login and userinfo #pact #user-access', () => {

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
  describe('/api/secure/login', () => {
    beforeAll((done) => {

      let interactions = []

      interactions.push(
        // Log In
        provider.addInteraction({
          uponReceiving: 'log in form submission',
          withRequest: {
            method: 'GET',
            path: '/api/secure/login',
            // headers: { 
            //   'Cache-Control': 'no-store, no-cache',
            //   'Content-type': 'application/x-www-form-urlencoded'
            // },
            // body: {
            //   'j_username': 'EXAMPLE_EMAIL',
            //   'j_password': 'EXAMPLE_PASSWORD'
            // }
          },
          willRespondWith: {
            status: 200,
            body: {
              "status":  Matchers.boolean(true),
              "dayRemain": Matchers.integer(4190),
              "maxPeriod": Matchers.integer(120),
              "remoteaccess": Matchers.boolean(false),
              "isRememberMe": Matchers.boolean(true),
              "contentSubscriptions": Matchers.eachLike("ADL", {min: 1}),
              "user":{
                "authorities":[
                    {"authority":"ROLE_REGUSER"},
                    {"authority":"SS_ROLE_STAFF"}
                  ],
                "baseProfileId": Matchers.like(706217),
                "dayRemain": Matchers.integer(4190),
                "firstName": Matchers.like("sample"),
                "lastName": Matchers.like("user"),
                "institutionId": Matchers.integer(24615),
                "shibbolethUser": Matchers.boolean(false),
                "ssAdmin": Matchers.boolean(false),
                "ssEnabled": Matchers.boolean(true),
                "typeId": 1,
                "userPCAllowed": Matchers.like("1"),
                "username": Matchers.like("EXAMPLE_EMAIL")
              }
            }
          }
        }),
        // // User info
        // provider.addInteraction({
        //   uponReceiving: 'registration form submission from an already registered user',
        //   withRequest: {
        //     method: 'GET',
        //     path: '/api/secure/register',
        //     headers: { 'Content-type': 'application/x-www-form-urlencoded' },
        //     body: mockAlreadyRegisteredFormInput
        //   },
        //   willRespondWith: {
        //     status: 200,
        //     headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        //     body: mockRegistrationResponses[1]
        //   }
        // })
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
    it('should return a successful login response', (done) => {
      _auth.login({'username': 'EXAMPLE_EMAIL', 'password': 'EXAMPLE_PASSWORD'})
        .then((data) => {
          expect(data.status).toBeTruthy()
          expect(data.user.username).toEqual('EXAMPLE_EMAIL')
          done()
        }, (err) => {
          console.error(err)
          done.fail(err)
        })
    })

    // Tests already registered service response
    // it('should return already registered status message', (done) => {
    //   _auth.registerUser(mockAlreadyRegisteredFormInput).subscribe((data) => {
    //     expect(data).toEqual(mockRegistrationResponses[1])
    //     done()
    //   })
    // })
    

  })

})


/**
 * Full example user object returned on login
 */
// {
  // "status":true,
  // "dayRemain": 4190,
  // "maxPeriod": 120,
  // "remoteaccess": false,
  // "isRememberMe": true,
  // "k12User": false,
  // "shibbolethUser": false,
  // "targetUrl": "",
  // "contentSubscriptions": ["ADL"],
  // "user":{
  //   "accesibleInstitutionsByUser":"",
  //   "authorities":[
  //     {"authority":"ROLE_REGUSER"},
  //     {"authority":"SS_ROLE_STAFF"}
  //     ],
  //   "baseProfileId":706217,
  //   "cIFolderAllowed":0,
  //   "citationsCount":0,
  //   "dayRemain":4190,
  //   "defaultView":"1",
  //   "facetedSearchView":0,
  //   "firstName":"sample",
  //   "institutionId":24615,
  //   "k12User":false,
  //   "lastName":"user",
  //   "maxPeriod":120,
  //   "portalDescipline":1,
  //   "portalInstitution":0,
  //   "profileInstitution":0,
  //   "referred":false,
  //   "regionId":1,
  //   "rememberMe":true,
  //   "sessionTimeout":1800000,
  //   "shibbolethUser":false,
  //   "ssAdmin":false,
  //   "ssEnabled":true,
  //   "thumbsPerPage":0,
  //   "typeId":1,
  //   "userAccesibleDesciplines":"",
  //   "userAccessiblePortalsMap":[],
  //   "userFromPortal":false,
  //   "userPCAllowed":"1",
  //   "userWithMultiInstitutionAccess":false,
  //   "username":"air01@artstor.org",
  //   "viewerView":"1"
  // }
// }