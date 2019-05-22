import { Injectable } from '@angular/core';

// Project Dependencies
import { RawSearchAsset, MediaObject, SearchAsset, AuthService } from 'app/shared';

@Injectable()
export class ThumbnailService {

    constructor(private _auth: AuthService) {

    }
    
    public searchAssetToThumbnail(asset: RawSearchAsset): AssetThumbnail {
        let cleanedSSID: string = asset.doi.substr(asset.doi.lastIndexOf('.') + 1) // split the ssid off the doi
        let cleanedMedia: MediaObject
        if (asset && asset.media && typeof asset.media == 'string') { cleanedMedia = JSON.parse(asset.media) }
        let cleanedAsset: SearchAsset = Object.assign(
          {}, // assigning it to a new object
          asset, // base is the raw asset returned from search
          { // this object contains all of the new properties which exist on a cleaned asset
            media: cleanedMedia, // assign a media object instead of a string
            ssid: cleanedSSID, // assign the ssid, which is taken off the doi
            thumbnailUrls: [] // this is only the array init - we add the urls later
          }
        )
        // Parse stringified compound media if available
        if (cleanedAsset.compound_media) {
          cleanedAsset.compound_media_json = JSON.parse(cleanedAsset.compound_media)
        }
        // Use the compound media thumbnail url where sequenceNum equals 1
        if (cleanedAsset && cleanedAsset.compound_media_json && cleanedAsset.compound_media_json.objects) {
          let compoundAsset = cleanedAsset.compound_media_json.objects.filter((asset) => {
            return asset['sequenceNum'] === 1
          })

          if (compoundAsset[0]) {
            cleanedAsset.thumbnailUrls.push(this._auth.getThumbHostname(true) + compoundAsset[0].thumbnailSizeOnePath)
          }
        }
        else { // make the thumbnail urls and add them to the array
          for (let i = 1; i <= 5; i++) {
            cleanedAsset.thumbnailUrls.push(this.makeThumbUrl(cleanedAsset.media.thumbnailSizeOnePath, i))
          }
        }

        // Build thumb url
        // if (thumbnail.status != 'not-available' && this.isDetailView && !this.isDowngradedMedia) {
        //     return this._search.makeDetailViewThmb(thumbnail)
        //     } 
        //     else if (this.isMultiView || (this.isDetailView && this.isDowngradedMedia)) {
        //     return thumbnail.thumbnailImgUrl
        //     } 
        //     else if (thumbnail.status != 'not-available') {
        //     return this.makeThumbUrl(thumbnail, this.thumbnailSize)
        //     } else {
        //     return
        // }

        return cleanedAsset
    }



    /**
     * Get image url to set on thumbnail
     */
    // getThumbnailImg(thumbnail: Thumbnail): string {
    //     if (thumbnail.status != 'not-available' && this.isDetailView && !this.isDowngradedMedia) {
    //     return this._search.makeDetailViewThmb(thumbnail)
    //     } 
    //     else if (this.isMultiView || (this.isDetailView && this.isDowngradedMedia)) {
    //     return thumbnail.thumbnailImgUrl
    //     } 
    //     else if (thumbnail.status != 'not-available') {
    //     return this._search.makeThumbUrl(thumbnail, this.thumbnailSize)
    //     } else {
    //     return
    //     }
    // }

    /**
   * Generate Thumbnail URL
   * @param thumbData: AssetData | Thumbnail - returned by search service, metadata service, or group service
   * @param size: number - sizes 0 through 4 are acceptable
   */
  public makeThumbUrl(thumbData: any, size?: number): string {
    let imagePath: string
    let isMultiView: boolean
    let isThumbnailImgUrl: boolean
    let isDowngradedMultiView: boolean
    let receivedFullUrl: boolean
    // Set default size
    if (!size) {
      size = 1
    }
    // Handle variations of Multi Views
    if (typeof(thumbData.tileSource) !== 'undefined' && thumbData.thumbnail_url === thumbData.tileSource) {
      // Handle downgraded Multi View
      isDowngradedMultiView = true
    } else if (typeof(thumbData.tileSource) === 'object' && thumbData.tileSource.length) {
      // Check if multi-view, when via search service
      isMultiView = true
    } else if (thumbData.compoundmediaCount) {
      // Check if multi-view, when via group service
      isMultiView = true
    }
    // Check thumbnail url source
    if (thumbData.thumbnailImgUrl) {
      isThumbnailImgUrl = true
      imagePath = thumbData.thumbnailImgUrl
    } else {
      imagePath = thumbData.thumbnail_url
    }
    // Test for full url 
    receivedFullUrl = /\/\/[\W\D]*(artstor.org)/.test(imagePath)
    // Multiviews and downgraded views receive FULL URLS via "thumbnail_url"
    // Group list service returns full urls as thumbnailImgUrl
    if ((isMultiView || isDowngradedMultiView) && receivedFullUrl) {
      return imagePath;
    }
    else if (isMultiView && isThumbnailImgUrl) {
      return this._auth.getThumbHostname(isMultiView) + imagePath;
    }
    else if (imagePath) {
      if (size) {
        imagePath = imagePath.replace(/(size)[0-4]/g, 'size' + size);
      }
      // Ensure relative
      if (imagePath.indexOf('artstor.org') > -1) {
        imagePath = imagePath.substring(imagePath.indexOf('artstor.org') + 12);
      }

      if (imagePath[0] != '/') {
        imagePath = '/' + imagePath;
      }

      if (imagePath.indexOf('thumb') < 0) {
        imagePath = '/thumb' + imagePath;
      }
    } else {
      imagePath = '';
    }
    // Determine if hostname should be appended
    return this._auth.getThumbHostname() + imagePath;
  }

}

export interface AssetThumbnail {
    // ???
    doi ?: string
    artstorid ?: string
}