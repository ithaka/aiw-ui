/*eslint-disable*/
import { HttpClientModule } from '@angular/common/http'
import { TestBed, getTestBed } from '@angular/core/testing'
import { PactWeb, Matchers } from '@pact-foundation/pact-web'

// Project Dependencies
import { MetadataRes } from '../shared/datatypes'
import { MetadataService } from '../shared/metadata.service';

describe("Metadata Calls #pact", () => {

    let provider;
    let _metadata;

    // Metadata for SS35538_35538_29885250, "If the Color Changes"
    const expectedMetadataObject: MetadataRes  = {
      "success":true,
      "total":1,
      "metadata":[{
          "resolution_x":600,
          "SSID":"11008184",
          "object_id":"SS35538_35538_29885250",
          "object_type_id":10,
          "thumbnail_url":"/thumb/imgstor/size0/sslps/c35538/11008184.jpg",
          "width":2772,
          "metadata_json":[
            {"count":1,"fieldName":"Creator", "fieldValue":"Mel Bochner, American, b. 1940, Pittsburgh, PA <br/> David Lasry, American, American","index":1},
            {"count":1,"fieldName":"Title", "fieldValue":"If the Color Changes","index":1},
            {"count":1,"fieldName":"Work Type", "fieldValue":"Monotype with embossing","index":1},
            {"count":1,"fieldName":"Date", "fieldValue":"2001","index":1},
            {"count":1,"fieldName":"Material", "fieldValue":"Monoprint with embossment","index":1},
            {"count":1,"fieldName":"Measurements", "fieldValue":"Sheet: 33 3/8 x 46 3/8 in. (84.8 x 117.8 cm) Framed: 42 x 55 in. (106.7 x 139.7 cm)","index":1},
            {"count":1,"fieldName":"Description", "fieldValue":"Mel Bochner is one of the leading artists associated with the development known as Conceptual Art.  In classic Conceptual Art, the idea precedes its representation; a written idea or number sequence determines the work's outcome.  During the 1960s and 1970s, Conceptual artists turned to &quot;non-visual&quot; forms, including writing, to record their ideas.  By contrast, Bochner has always infused his Conceptualism with a strongly visual component. The series If the Color Changes  exemplifies this synthetic approach. The project was inspired by a quotation from Ludwig Wittgenstein's Remarks on Color  (1950-51).  As one of the premier language philosophers, Wittgenstein (Austrian, 1889-1951) has long been a major source for many Conceptualists.  Yet the translation of his thought into art is not straightforward, since Wittgenstein's writings question language's ability to convey what we see.  A simple image-for example, &quot;blue vase&quot;-becomes the pretext for a dizzying language game.  Is the blue a sensation, a word on a page, a thought in one's mind, an intrinsic quality of the vase? Appropriately, If the Color Changes depicts the impossibility of translation--of what we see into words, of one language into another.  The overlap of the German and English versions of the text causes a mental disconnect as one attempts to hold both in one's mind.  Which is the &quot;true&quot; representation of Wittgenstein's statement?  Neither, and both.","index":1},
            {"count":1,"fieldName":"Repository", "fieldValue":"Michael C. Carlos Museum, Emory University","index":1},
            {"count":1,"fieldName":"Accession Number", "fieldValue":"2001.025.002","index":1},
            {"count":1,"fieldName":"Subject", "fieldValue":"Monotype with embossing","index":1},
            {"count":1,"fieldName":"Collection", "fieldValue":"Michael C. Carlos Museum Collections Online","index":1},
            {"count":2,"fieldName":"Source", "fieldValue":"Art History Department Fund","index":1},
            {"count":2,"fieldName":"Source", "fieldValue":"Photographer: Bruce White","index":2},
            {"count":3,"fieldName":"Rights", "fieldValue":"© Mel Bochner. Image courtesy of the Michael C. Carlos Museum, Emory University.  Photo by Bruce M. White, 2006.","index":1},
            {"count":3,"fieldName":"Rights", "fieldValue":"This image is provided by the Michael C. Carlos Museum of Emory University. This image is available under the ArtStor Digital Library Terms and Conditions of Use only.  For all other uses, please contact the Michael C. Carlos Museum Office of Collections Services at +1(404) 727-4282 or mccm.collections.services@emory.edu. The Museum assumes no responsibility for royalties or fees claimed by the artist or third parties.  The User agrees to indemnify and hold harmless Emory University, its Michael C. Carlos Museum, its agents, employees, faculty members, students and trustees from and against any and all claims, losses, actions, damages, expenses, and all other liabilities, including but not limited to attorney’s fees, directly or indirectly arising out of or resulting from its use of photographic images for which permission is granted hereunder.","index":2},
            {"count":3,"fieldName":"Rights", "fieldValue":"This image has been selected and made available by a user using Artstor's software tools. Artstor has not screened or selected this image or cleared any rights to it and is acting as an online service provider pursuant to 17 U.S.C. §512. Artstor disclaims any liability associated with the use of this image. Should you have any legal objection to the use of this image, please visit http://www.artstor.org/copyright for contact information and instructions on how to proceed.","index":3},
            {"count":1,"fieldName":"Published References", "fieldValue":"MCCM Newsletter, March - May 2002.<br/> Michael C. Carlos Museum: Highlights of the Collections (Atlanta: Michael C. Carlos Museum, 2011), 155.","index":1},
            {"count":1,"fieldName":"Exhibition History", "fieldValue":"Mel Bochner: If the Color Changes, Michael C. Carlos Museum, August 22, 2002 - January 26, 2003<br/> Modern and Contemporary Masters: Highlights from the Works on Paper Collection, Michael C. Carlos Museum, January 24 - May 17, 2009","index":1},
            {"count":1,"fieldName":"On View", "fieldValue":"No","index":1}
        ],
        "fileProperties": [
          {"fileName":"11008184.fpx"}
        ],
        "updated_on": "2017-06-09T18:36:37Z",
        "image_url": "sslps/c35538/11008184.fpx/47cA6zw3AJcbqsn2RT5KkA/1532635760/",
        "collections": [
            { "type":"5", "id":"87730057", "name":"Michael C. Carlos Museum Collections Online"},
            {"type":"2", "id":"35538", "name":"Michael C. Carlos Museum Collections Online"}
        ],
        "title":"If the Color Changes",
        "category_name":"",
        "icc_profile_loc":null,
        "resolution_y":600,
        "contributinginstitutionid":10028,
        "category_id":"",
        "height":2131,
        "download_size":"1024,1024"
      }]
    }

    // We want to use Pact to verify the types of the properties on the response
    let matcherMetadataObject = {}
    Object.keys(expectedMetadataObject).forEach( (key) => {
      matcherMetadataObject[key] = Matchers.somethingLike(expectedMetadataObject[key])
    })

    beforeAll(function(done) {
      provider = new PactWeb({ 
        consumer: 'aiw-ui', 
        provider: 'binder-metadata', 
        port: 1234, 
        host: 'localhost' 
      })
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
     * Mock and test group listing endpoint
     */
    describe("GET /api/v1/metadata", () => {
      beforeAll((done) =>  {

        provider.addInteraction({
          uponReceiving: 'a request for an asset\'s metadata',
          withRequest: {
            method: 'GET',
            path: '/api/v1/metadata',
            query: "legacy=false&object_ids=SS35538_35538_29885250"
          },
          willRespondWith: {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: matcherMetadataObject
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

      it("should return metadata for one object",
       function(done) {
        //Run the tests
        _metadata.getMetadata('SS35538_35538_29885250')
          .subscribe(res => {
            expect(res).toEqual(expectedMetadataObject)
          },
          err => {

          done.fail(err)
        })
      })
    })
  })