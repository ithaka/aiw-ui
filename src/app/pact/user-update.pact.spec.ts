/*eslint-disable*/
import {Http, HttpModule, BaseRequestOptions, Response, RequestOptions, XHRBackend, ResponseOptions, RequestMethod} from '@angular/http';
import {TestBed, inject, getTestBed, async} from '@angular/core/testing';
import { AccountService } from './../shared'
import { PactWeb, Matchers} from '@pact-foundation/pact-web'
import { HttpClientModule } from '@angular/common/http'

describe("PUT /api/v1/user #pact", () => {

  let provider


  beforeAll(function(done) {
    provider = new PactWeb({ consumer: 'aiw', provider: 'auth-service' })

    // required for slower Travis CI environment
    setTimeout(function () { done() }, 2000)

    // Required if run with `singleRun: false`
    provider.removeInteractions()
  })

  afterAll(function (done) {
    provider
    .finalize()
    .then(function () { done() }, function (err) { done.fail(err) })
  })

  let service
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
        providers: [
          AccountService
        ]
    })
    const testbed = getTestBed();
    service = testbed.get(AccountService);
  })

  describe("update properties on user object", () => {

    const updateObjects: { field: string, value: any }[] = [
      {
        field: 'firstName',
        value: 'a new first name!'
      },
      {
        field: 'lastName',
        value: 'a new last name!'
      },
      {
        field: 'departmentRole',
        value: 'a new role for the user!'
      },
      {
        field: 'department',
        value: 'a new department!'
      },
      {
        field: 'allowSurvey',
        value: true
      },
      {
        field: 'allowUpdatesSurvey',
        value: true
      }
    ]

    beforeAll(async function () {
      let interactions = []
      // for(let obj of updateObjects) {
      //   let body = {
      //     [obj.field]: obj.value
      //   }
      //   interactions.push(
      //     provider.addInteraction({
      //       uponReceiving: "a request to update a user's " + obj.field,
      //       withRequest: {
      //         method: 'PUT',
      //         path: '/api/v1/users',
      //         body: Matchers.somethingLike(body)
      //       },
      //       willRespondWith: {
      //         status: 200
      //       }
      //     })
      //   )
      // }

        interactions.push(
          provider.addInteraction({
            uponReceiving: "a PUT request",
            withRequest: {
              method: 'PUT',
              path: '/api/v1/users',
              body: Matchers.somethingLike({ fieldName: 'value' })
            },
            willRespondWith: {
              status: 200
            }
          })
        )

      await Promise.all(interactions)
    })

    it('should work', (done) => {
      service.update({ firstName: 'corbin' })
      .subscribe((res) => {
        done()
      }, (err) => {
        done.fail(err)
      })
    })

    // for(let obj of updateObjects) {
    //   it("should update a user's " + obj.field, (done) => {
    //     //Run the tests
    //     service.update({ [obj.field]: obj.value })
    //       .subscribe(res => {
    //         done()
    //       },
    //       err => {
    //         done.fail(err)
    //     })
    //   })
    // }

    // it("should update all of a users updateable properties", (done) => {
    //   let updateObj = {}
    //   // get one value for every object
    //   for(let obj of updateObjects) {
    //     updateObj[obj.field] = obj.value
    //   }

    //   service.update(updateObj)
    //   .subscribe(res => {
    //     for(let key in updateObj) {
    //       expect(res.updated[key]).toEqual(updateObj[key])
    //     }
    //     done()
    //   },
    //     err => {
    //     done.fail(err)
    //   })
    // })
  })
})