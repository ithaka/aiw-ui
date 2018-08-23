/*eslint-disable*/
import { HttpClientModule } from '@angular/common/http'
import { TestBed, getTestBed } from '@angular/core/testing'
import { PactWeb, Matchers } from '@pact-foundation/pact-web'

// Project Dependencies
import { MetadataRes } from '../shared/datatypes'
import { MetadataService } from '../shared/metadata.service';

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
     * - Metadata for SS35538_35538_29885250, "If the Color Changes"
     */
    const expectedMetadataObject: MetadataRes  = {
      'success': true,
      'total': 1,
      'metadata': [{
          'resolution_x': 600,
          'SSID': '11008184',
          'object_id': 'SS35538_35538_29885250',
          'object_type_id': 10,
          'thumbnail_url': '/thumb/imgstor/size0/sslps/c35538/11008184.jpg',
          'width': 2772,
          'metadata_json': [
            {'count': 1, 'fieldName': 'Creator', 'fieldValue': 'Mel Bochner, American, b. 1940, Pittsburgh, PA <br/> David Lasry, American, American', 'index': 1},
            {'count': 1, 'fieldName': 'Title', 'fieldValue': 'If the Color Changes', 'index': 1},
            {'count': 1, 'fieldName': 'Work Type', 'fieldValue': 'Monotype with embossing', 'index': 1},
            {'count': 1, 'fieldName': 'Date', 'fieldValue': '2001', 'index': 1}
        ],
        'fileProperties': [
          {'fileName': '11008184.fpx'}
        ],
        'updated_on': '2017-06-09T18:36:37Z',
        'image_url': 'sslps/c35538/11008184.fpx/47cA6zw3AJcbqsn2RT5KkA/1532635760/',
        // Optional property for compound objects
        'image_compound_urls' : [
          // Example image viewer URLs for "Illustrated Manuscript" (SSID: 18739143)
          "sslps/c7731421/18739141.fpx/rY3pHQpNknS89SdoTjVW3g/1534355588/",
          "sslps/c7731421/18739144.fpx/RprdR0J-Bw-15MF8q8DVrw/1534355589/",
          "sslps/c7731421/18739143.fpx/t6Ois8iIBALNndLLo7TFnA/1534355591/"
        ],
        'collections': [
            {'type': '5', 'id': '87730057', 'name': 'Michael C. Carlos Museum Collections Online'},
            {'type': '2', 'id': '35538', 'name': 'Michael C. Carlos Museum Collections Online'}
        ],
        'title': 'If the Color Changes',
        'category_name': '',
        'icc_profile_loc': null,
        'resolution_y': 600,
        'contributinginstitutionid': 10028,
        'category_id': '',
        'height': 2131,
        'download_size': '1024,1024'
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
          MetadataService
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
            query: 'legacy=false&object_ids=SS35538_35538_29885250'
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
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
        _metadata.getMetadata('SS35538_35538_29885250')
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
