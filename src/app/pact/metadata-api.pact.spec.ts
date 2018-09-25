/*eslint-disable*/
import { HttpClientModule } from '@angular/common/http'
import { TestBed, getTestBed } from '@angular/core/testing'
import { PactWeb, Matchers } from '@pact-foundation/pact-web'

// Project Dependencies
import { MetadataRes } from '../shared/datatypes'
import { MetadataService } from '../shared/metadata.service';
import { FlagService } from '../shared';

describe('Metadata Calls #pact #metadata', () => {

    let provider;
    let _metadata;
    /**
     *  We want to use Pact to verify the types of the properties on the response
     * - Ensure type checking on nested properties, and array objects
     */
    let generateMetadataMatcher = (expectedObject): any => {
      let matcherObject = {}
      Object.keys(expectedObject).forEach( (key) => {
        if (typeof(expectedObject[key] === 'Array') && expectedObject[key][0]) {
          matcherObject[key] = Matchers.eachLike(expectedObject[key][0])
        } else {
          matcherObject[key] = Matchers.like(expectedObject[key])
        }
      })
      return matcherObject
    }

    /**
     * Image asset metadata
     * - Metadata for SS34216_34216_39230202, a compound object
     */
    const expectedMetadataObject: MetadataRes  = {
      'success': true,
      'total': 1,
      'metadata': [{
        "resolution_x": 600,
        "SSID": "1002547028",
        "object_id": "SS34216_34216_39230202",
        "object_type_id": 10,
        "thumbnail_url": "/media-objects/25302/representation/size/2",
        "width": 0,
        "metadata_json": [
          {
            "count": 1,
            "fieldName": "Rights",
            "fieldValue": "This image has been selected and made available by a user using Artstor's software tools. Artstor has not screened or selected this image or cleared any rights to it and is acting as an online service provider pursuant to 17 U.S.C. §512. Artstor disclaims any liability associated with the use of this image. Should you have any legal objection to the use of this image, please visit http://www.artstor.org/copyright for contact information and instructions on how to proceed.",
            "index": 1
          }
        ],
        "fileProperties": [],
        "updated_on": "2018-09-07T14:52:54Z",
        "image_url": "/2018/09/07/10/b157b359-de80-4d4b-893e-c41d299e0e66_deflate.tif/info.json",
        "collections": [],
        "title": "Sample Compound Object",
        "category_name": "",
        "image_compound_urls": [
          "/2018/09/07/10/2f7742cd-414c-4da7-83b9-1a1f06629876_deflate.tif/info.json",
          "/2018/09/07/10/8d0df8df-2b1c-4dd2-89d5-4b60beb8b842_deflate.tif/info.json",
          "/2018/09/07/10/6e9b9835-ee80-4f0e-8daa-d5a6170f8e3a_deflate.tif/info.json",
          "/2018/09/07/10/8ec0ce6d-f662-4833-aef0-0f45f500233f_deflate.tif/info.json",
          "/2018/09/07/10/976b78c4-c72d-43c0-bfe7-60db03468bfa_deflate.tif/info.json",
          "/2018/09/07/10/145169a0-548c-4cc9-a586-d2cd480b5306_deflate.tif/info.json",
          "/2018/09/07/10/ca7319bf-8a01-4662-8d27-b3a2fe120144_deflate.tif/info.json",
          "/2018/09/07/10/910b249e-8830-49f5-95e7-7a47d815fafc_deflate.tif/info.json",
          "/2018/09/07/10/acb2538e-658f-4db3-af2e-ff4b8d332cf8_deflate.tif/info.json",
          "/2018/09/07/10/b157b359-de80-4d4b-893e-c41d299e0e66_deflate.tif/info.json"
        ],
        "resolution_y": 600,
        "contributinginstitutionid": 24615,
        "category_id": "",
        "height": 0,
        "download_size": "1024,1024"
      }]
    }

    beforeAll(function(done) {
      provider = new PactWeb({ consumer: 'aiw-ui', provider: 'binder-metadata', port: 1202 })
      // Required for slower environments
      setTimeout(function () { done() }, 2000)
      // Required if run with `singleRun: false` (see karma config)
      provider.removeInteractions()
    })

    afterAll(function (done) {
      provider.finalize()
        .then(function () { done() }, function (err) { done.fail(err) })
    })

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          MetadataService,
          FlagService
        ],
        imports: [
          HttpClientModule
        ]
      });

      _metadata = getTestBed().get(MetadataService)
    });

    /**
     * Mock and test getting an asset's metadata
     */
    describe('GET asset via /api/v1/metadata', () => {
      beforeAll((done) =>  {

        provider.addInteraction({
          uponReceiving: 'a request for an asset\'s metadata',
          withRequest: {
            method: 'GET',
            path: '/api/v1/metadata',
            query: 'object_ids=SS34216_34216_39230202&legacy=false'
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json;charset=UTF-8' },
            body: generateMetadataMatcher(expectedMetadataObject)
          }
        })
        .then(() => { done() }, (err) => { done.fail(err) })
      })

      afterEach((done) => {
        provider.verify()
        .then(function(a) {
          done()
        }, function(e) {
          done.fail(e)
        })
      })

      it('should return metadata for an asset',
       function(done) {
        // Run the tests
        _metadata.getMetadata('SS34216_34216_39230202', null, false)
          .subscribe(res => {
            expect(res).toEqual(expectedMetadataObject)
            done()
          },
          err => {
            done.fail(err)
          }
        )
      })
    })
  })
