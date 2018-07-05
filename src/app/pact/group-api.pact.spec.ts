/*eslint-disable*/
import {Http, HttpModule, BaseRequestOptions, Response, RequestOptions, XHRBackend, ResponseOptions, RequestMethod} from '@angular/http';
import {TestBed, inject, getTestBed, async} from '@angular/core/testing';
// import {HelloApiService} from '../hello/hello-api.service';
import {PactWeb, Matchers} from '@pact-foundation/pact-web';
import { GroupService } from '../shared';

// let Pact = require('pact-web')

describe("Pact consumer test", () => {

    let provider;

    const expectedGroupList: GroupList = {
      "success":true,
      "total":3,
      "groups":[
        {"tags":[],"sequence_number":0,"update_date":"2017-12-06T13:50:41Z","name":"All PC Assets","public":false,"creation_date":"2017-12-06T13:49:57Z","id":"ba35d77a-7b98-49ee-8102-25c7e4a35ae5","access":[],"items":["SS36904_36904_35824231"]},
        {"tags":[],"sequence_number":0,"update_date":"2017-07-07T17:00:40Z","name":"Some Assets","public":false,"creation_date":"2017-07-07T17:00:40Z","id":"a1fc32cc-8859-49f7-a560-5da0c5928500","access":[],"items":["AAFOLKAIG_10313142481","AAFOLKAIG_10313142791","AAFOLKAIG_10313143138","AAGOIG_10314000081"]},
        {"tags":["PC Test","MLK"],"sequence_number":0,"update_date":"2017-08-07T16:03:09Z","name":"PC test","public":false,"creation_date":"2017-01-09T23:45:40Z","id":"900590","access":[],"items":["CARNEGIE_700001","MOMA_620002","MOMA_600006"]}],
      "tags":[{"key":"MLK","doc_count":1},{"key":"PC Test","doc_count":1}]
    }

    // const expectedGroupId: string = "a1fc32cc-8859-49f7-a560-5da0c5928500"
    // const expectedGroup: any = {"description":"","tags":[],"sequence_number":0,"update_date":"2017-07-07T17:00:40Z","name":"Some Assets","public":false,"creation_date":"2017-07-07T17:00:40Z","id":"a1fc32cc-8859-49f7-a560-5da0c5928500","access":[{"entity_type":200,"entity_identifier":"24615","access_type":100}],"items":["AAFOLKAIG_10313142481","AAFOLKAIG_10313142791","AAFOLKAIG_10313143138","AAGOIG_10314000081"]}
    
    beforeAll(function(done) {
//      client = example.createClient('http://localhost:1234')
      provider = new PactWeb({ consumer: 'aiw-client', provider: 'group-service', port: 1234, host: 'localhost' })

      // required for slower Travis CI environment
      setTimeout(function () { done() }, 2000)

      // Required if run with `singleRun: false`
      provider.removeInteractions()
    })

    afterAll(function (done) {
      provider.finalize()
        .then(function () { done() }, function (err) { done.fail(err) })
    })

    let service;
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpModule],
          providers: [
            GroupService
          ]
      });
      const testbed = getTestBed();
        service = testbed.get(GroupService);
    });

    describe("getAllGroups", () => {
      beforeAll((done) =>  {
        provider.addInteraction({
          uponReceiving: 'a request for all public groups',
          withRequest: {
            method: 'GET',
            path: '/api/v1/group',
            query: 'level=public'
          },
          willRespondWith: {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: Matchers.somethingLike(expectedGroupList)
          }
        })
        .then(() => { done() }, (err) => { done.fail(err) })
      })

      it("should return a Group List object", function(done) {
        //Run the tests
        service.getAllGroups('public')
          .subscribe(res => {
            expect(res).toEqual(expectedGroupList)
            done()
          },
          err => {

          done.fail(err)
        })
      });

      // verify with Pact, and reset expectations
      it('successfully verifies', function(done) {
        provider.verify()
          .then(function(a) {
            done()
          }, function(e) {
            done.fail(e)
          })
      })
    })
  })

  export interface GroupList {
    success: boolean,
    total: number,
    groups: any[],
    tags: any[]
  }