/// <reference types="@types/gapi" />
/// <reference types="@types/gapi.auth2" />
/// <reference types="@types/gapi.client.slides" />

//import { gapi } from '@types/gapi.client.slides'

//gapi.slides

import { presentations } from 'slides.presentations'

import { Injectable } from '@angular/core';
import { environment } from 'environments/environment'

@Injectable({
  providedIn: 'root'
})
export class SlidesService {
  constructor() {}

  /**
   *  loadClientInit
   *  Called to init gapi client and auth2 library
   */
  public loadClientInit(): void | Error {
    gapi.load('client:auth2:slides;', this.initClient)
  }

  /**
   *  gAuthSignIn - Google OAuth2 sign in
   */
  public gAuthSignIn(): Promise<gapi.auth2.GoogleUser> | Error {
    return gapi.auth2.getAuthInstance().signIn();
  }

  /**
  *  gAuthSignOut - Google OAuth2 sign out
  */
  public gAuthSignOut(): gapi.auth2.GoogleAuth | Error {
    return gapi.auth2.getAuthInstance().signOut();
  }

/**
 *  Initializes the API client library.
 */
  public initClient(): Promise<void> | Error {
    return gapi.client.init({
      clientId: <string>environment.GAPI_TEST[0],
      apiKey: <string>environment.GAPI_TEST[1],
      discoveryDocs: <string[]>environment.GAPI_TEST[2],
      scope: <string>environment.GAPI_TEST[3]
    })
  }


  /** GENERATE */

  public newPresentation(imageGroup) {
    let payload = this.preparePresentation(imageGroup)

    console.log('REQUEST PAYLOAD: ', payload)

    gapi.client['slides'].presentations.create(payload).then(function (response) {
        let presentation = response.result;
        console.log('Created presentation with ID: %s', presentation.presentationId);
      }, (response) => {
        console.log('Error: ' + response.result.error.message);
      })

  }

  public preparePresentation(group) {

    //let imgUrl = "//stage.artstor.org/api/download?imgid=LESSING_ART_10311440667&url=http%3A%2F%2Fimgserver.artstor.net%2Flessing%2Fart%2Flessing_03070168.fpx%2F4tpyHbTBu0nqakCP1Orz_Q%2F1554147326%2F%3Fcell%3D1024%2C1024%26rgnn%3D0%2C0%2C1%2C1%26cvt%3DJPEG&groupid=8acc0cc2-49c9-42d5-bb5d-d7aeae16a8c5"
    let imgUrl = "https://stage.artstor.org/thumb/imgstor/size1/lessing/art/lessing_03070168.jpg"

    let pageBackground = {
      solidFill: {
          color: {
            rgbColor: {
              red: 0,
              green: 0,
              blue: 0
            }
          },
          alpha: 1.0
      }
    }

    let imageProps = {
      transparency: 0,
      brightness: 0,
      contrast: 0
    }

    let image = {
      contentUrl: imgUrl,
      // sourceUrl: imgUrl,
      imageProperties: imageProps,
    }

    let page = {
      objectId: 'test-object-id',
      pageType: 'SLIDE',
      pageElements: [ { image: image }],
      pageProperties: {
        pageBackgroundFill: pageBackground
      },
      slideProperties: {
        layoutObjectId: "artstor-layout-title-page",
        masterObjectId: "simple-dark"
      }


    }

    return {
      title: group.name,
      slides: [page, page],
      masters: this.masters,
      layouts: this.layouts
    }
  }

  private masters = [{
    objectId: 'artstor-master-title-page',
    masterProperties: {},
    pageElements: [],
    pageProperties: {
      colorScheme: {
        colors: [
          {
            color: {},
            type: "DARK1",
          }
        ]
      },
      pageBackgroundFill: {
        solidFill: {
          color: {
            rgbColor: {
              red: 0,
              green: 0,
              blue: 0
            }
          },
          alpha: 1.0
        }
      }
    },
    pageType: "MASTER"
  }]

  private layouts = [{
    objectId: 'artstor-layout-title-page',
    layoutProperties: {
      displayName: "Title slide",
      masterObjectId: "artstor-master-title-page",
      name: "TITLE"
    },
    pageElements: [],
    pageProperties: {

    }
  }]



}


// PAGE

//   // Union field properties can be only one of the following:
//   "slideProperties": {
//     object(SlideProperties)
//   },
//   "layoutProperties": {
//     object(LayoutProperties)
//   },
//   "notesProperties": {
//     object(NotesProperties)
//   },
//   "masterProperties": {
//     object(MasterProperties)
//   }
//   // End of list of possible types for union field properties.
// }
