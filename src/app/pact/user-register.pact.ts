import { HttpClientModule } from '@angular/common/http'
import { TestBed, getTestBed, inject, async } from '@angular/core/testing'
import { PactWeb, Matchers } from '@pact-foundation/pact-web'

import { RegisterComponent } from '../register/register.component'

describe('PUT /api/secure/register #pact #user-register', () => {

  let provider
  let register: RegisterComponent

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
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: mockRegistrationResponse
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

      this.register.registerSubmit()
        .then(res => {
          expect(res).toEqual(mockRegistrationResponse)
          expect(res.name.length).toBeGreaterThan(0)
          done()
        },
          err => {
            done.fail(err)
          })


    })
  })


})

let mockRegistrationResponse = {
  test: 'test'
}
