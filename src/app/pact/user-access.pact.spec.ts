import { Location } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { RouterModule, Router, ActivatedRoute } from '@angular/router'
import { TestBed, getTestBed, inject, async } from '@angular/core/testing'
import { Idle, DEFAULT_INTERRUPTSOURCES, IdleExpiry } from '@ng-idle/core'
import { PactWeb, Matchers } from '@pact-foundation/pact-web'
import { Angulartics2, ANGULARTICS2_TOKEN, RouterlessTracking } from 'angulartics2'

import { AppConfig } from '../app.service'
import { AuthService } from '_services'
import { Injector, PLATFORM_ID } from '@angular/core';
import { ArtstorStorageService } from '../../../projects/artstor-storage/src/public_api';
import { take } from 'rxjs/operators';
import { Subject } from 'rxjs';

describe('Login, logout, and userinfo #pact #user-access', () => {

  let provider, _auth

  beforeAll(function (done) {
    provider = new PactWeb({
      logLevel: "debug",
      consumer: 'aiw-ui',
      provider: 'artaa_service',
      port: 1206
    })
    setTimeout(function () { done() }, 2000)
    provider.removeInteractions()
  })

  afterAll(function (done) {
    provider.finalize().then(done, done.fail)
  })

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      declarations: [
      ],
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: Router, useValue: {} },
        { provide: ActivatedRoute, useValue: {} },
        { provide: RouterlessTracking, useValue: {} },
        { provide: Angulartics2, useValue: {
          eventTrack: new Subject(),
          setUsername: new Subject(),
          setUserProperties: new Subject()
        } },
        { provide: Location , useValue: {} },
        { provide: 'request', useValue: {
          headers: {},
          ip: '192.168.1.1',
          get: (string) => { return '' }
        }},
        { provide: ArtstorStorageService, useValue: {
          getLocal: (string) => {return {}},
          setLocal: (string, thing) => { return; },
          clearLocalStorage: () => {return {}}
        }},
        Injector,
        AppConfig,
        AuthService,
        Idle, IdleExpiry
      ],
    })
    const testbed = getTestBed()
    _auth = testbed.get(AuthService)

  })

  /**
  * Describes '/api/secure/login' endpoint
  */
  fdescribe('/api/secure/login', () => {
    beforeAll((done) => {
      // Set up expected objects
      let expectedUserResponse = {
        "status":  Matchers.boolean(true),
        "dayRemain": Matchers.integer(4190),
        "maxPeriod": Matchers.integer(120),
        "remoteaccess": Matchers.boolean(false),
        "isRememberMe": Matchers.boolean(true),
        "contentSubscriptions": Matchers.eachLike("ADL", { min: 1 }),
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

      let expectedLogoutResponse = { "status": true }

      let interactions = []

      interactions.push(
        // Log In
        provider.addInteraction({
          uponReceiving: 'log in form submission',
          withRequest: {
            method: 'POST',
            path: '/api/secure/login',
            headers: {
              'Cache-Control': 'no-store, no-cache',
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
              'j_username': 'EXAMPLE_EMAIL',
              'j_password': 'EXAMPLE_PASSWORD'
            }
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: expectedUserResponse
          }
        }),
        // Log Out
        provider.addInteraction({
          uponReceiving: 'logout request',
          withRequest: {
            method: 'POST',
            path: '/api/secure/logout',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {}
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: expectedLogoutResponse
          }
        }),
        // User info
        provider.addInteraction({
          uponReceiving: 'registration form submission from an already registered user',
          withRequest: {
            method: 'GET',
            path: '/api/secure/userinfo'
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json;charset=UTF-8'
            },
            body: expectedUserResponse
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
          console.log(e)
          done.fail(e)
        })
    })

    // Test successful login response
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

    // Test successful logout response
    it('should return a successful logout response', (done) => {
      _auth.logout()
        .then((data) => {
          expect(data.status).toBeTruthy()
          done()
        }, (err) => {
          console.error(err)
          done.fail(err)
        })
    })

    // Test userinfo/session call
    it('should return already registered status message', (done) => {
      _auth.getUserInfo().pipe(take(1)).subscribe(
        data => {
          expect(data.status).toBeTruthy()
          expect(data.user.username).toBeTruthy()
          done()
        },
        err => {
          console.log(err)
          done.fail(err)
        }
      )
    })

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
