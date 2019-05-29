import { Injectable } from '@angular/core';

// Project Dependencies
import { AuthService } from './auth.service'
import { RawSearchAsset, MediaObject } from './asset-search.service'
import { AssetThumbnail, RawItemAsset, CollectionTypeHandler, CollectionTypeInfo } from 'datatypes'

@Injectable()
export class ThumbnailService {

  constructor(private _auth: AuthService) {

  }
  
  /**
   * Transforms object:
   * SEARCH/Solr record --> AIW AssetThumbnail
   */
  public searchAssetToThumbnail(asset: RawSearchAsset): AssetThumbnail {
      let cleanedSSID: string = asset.doi.substr(asset.doi.lastIndexOf('.') + 1) // split the ssid off the doi
      let cleanedMedia: MediaObject
      if (asset && asset.media && typeof asset.media == 'string') { cleanedMedia = JSON.parse(asset.media) }
      let cleanedAsset: AssetThumbnail | any = Object.assign(
        {}, // assigning it to a new object
        asset, // base is the raw asset returned from search
        { // this object contains all of the new properties which exist on a cleaned asset
          media: cleanedMedia, // assign a media object instead of a string
          ssid: cleanedSSID, // assign the ssid, which is taken off the doi
          thumbnailUrls: [], // this is only the array init - we add the urls later
          img: ''
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

      // Attach media flags
      cleanedAsset = this.attachMediaFlags(cleanedAsset)
      // Attach usable thumbnail url
      cleanedAsset.img = this.getThumbnailImg(cleanedAsset)

      return <AssetThumbnail>cleanedAsset
  }

  /**
   * Transforms object:
   * Group/Item service result --> AIW AssetThumbnail
   */
  public itemAssetToThumbnail(item: RawItemAsset): AssetThumbnail 
  {
    let cleanedAsset: AssetThumbnail = {
      name: item.tombstone[0],
      agent: item.tombstone[1],
      date: item.tombstone[2],
      objectId: item.objectId,
      objectTypeId: item.objectTypeId,
      collectionTypeInfo: this.getCollectionType(item),
      multiviewItemCount: item.compoundmediaCount,
      status: item.status,
      img : '',
      thumbnailImgUrl: item.thumbnailImgUrl,
      zoom: item.zoom
    }
    // media takes priority over thumbnailImgUrl
    if (item['media'] && item.media.thumbnailSizeOnePath) {
      cleanedAsset.thumbnailImgUrl = item.media.thumbnailSizeOnePath
    } else if (item['thumbnailImgUrl'] && item.compoundmediaCount > 0) {
      cleanedAsset.thumbnailImgUrl = this._auth.getThumbHostname(true) + item.thumbnailImgUrl
    }
    // Attach media flags
    cleanedAsset = this.attachMediaFlags(cleanedAsset)
    // Attach usable thumbnail url
    cleanedAsset.img = this.getThumbnailImg(cleanedAsset)
    // Set as AssetThumbnail
    return cleanedAsset
  }

  private getCollectionType(thumbnail: any): CollectionTypeInfo {
    let collectionValue = thumbnail['collectionType'] ? [ thumbnail['collectionType'] ] : thumbnail['collectiontypes']
    return CollectionTypeHandler.getCollectionType(collectionValue, thumbnail['contributinginstitutionid'])
  }

  /**
   * Get image url to set on thumbnail
   */
  getThumbnailImg(thumbnail: AssetThumbnail): string {
      if (thumbnail.status != 'not-available' && thumbnail.isDetailView && !thumbnail.isDowngradedMedia) {
        return this.makeDetailViewThmb(thumbnail)
      } else if (thumbnail.isMultiView || (thumbnail.isDetailView && thumbnail.isDowngradedMedia)) {
        return thumbnail.thumbnailImgUrl
      } else if (thumbnail.status != 'not-available') {
        return this.makeThumbUrl(thumbnail)
      } else {
        return
      }
  }

  /**
   * Decorate with media type flags
   * - Should not be referenced outside of the service, instead use public transform functions
   * @param thumbnail 
   */
  private attachMediaFlags(thumbnail: AssetThumbnail): AssetThumbnail {
    // Compound 'multiview' assets for image groups, assigned in assets service
    if (thumbnail.multiviewItemCount) {
      thumbnail.isMultiView = true
      thumbnail.multiviewItemCount = thumbnail.multiviewItemCount
    }
    // Compound 'multiview' assets use cleanedAsset.thumbnailUrls[0], assigned in asset-search
    if (thumbnail.compound_media_json && thumbnail.compound_media_json.objects) {
      thumbnail.isMultiView = true
      thumbnail.thumbnailImgUrl = thumbnail['thumbnailUrls'][0]
      thumbnail.multiviewItemCount = thumbnail.compound_media_json.objects.length
    } else if (thumbnail['media']) {
      thumbnail.thumbnailImgUrl = thumbnail.media.thumbnailSizeOnePath
    }

    // Set isDetailView
    if (thumbnail.zoom) {
      thumbnail.isDetailView = true
    }
    // Set isDowngradedMedia
    if ( (thumbnail.isMultiView && thumbnail.media && thumbnail.media.format === 'null') ||
        ( (thumbnail.isMultiView || thumbnail.isDetailView) && thumbnail.multiviewItemCount === 1)) {
      thumbnail.isDowngradedMedia = true
    }
    // Set alt text
    thumbnail.thumbnailAlt = thumbnail['name'] ? 'Thumbnail of ' +thumbnail['name'] : 'Untitled'
    thumbnail.thumbnailAlt = thumbnail['agent'] ? thumbnail.thumbnailAlt + ' by ' +thumbnail['agent'] : thumbnail.thumbnailAlt + ' by Unknown'
    return thumbnail
  }

  /**
   * Generate Thumbnail URL for detailed view using the zoom property of the thumbnail
   */
  public makeDetailViewThmb(thumbnailObj: AssetThumbnail): string{
    let thumbURL: string = ''
    let tileSourceHostname = (this._auth.getEnv() == 'test') ? '//tsstage.artstor.org' : '//tsprod.artstor.org'
    let imgURL = thumbnailObj.thumbnailImgUrl.replace('/thumb/imgstor/size0', '').replace('.jpg', '.fpx')
    thumbURL = tileSourceHostname + '/rosa-iiif-endpoint-1.0-SNAPSHOT/fpx' + encodeURIComponent(imgURL) + '/' + thumbnailObj.zoom.viewerX + ',' + thumbnailObj.zoom.viewerY + ',' + thumbnailObj.zoom.pointWidth + ',' + thumbnailObj.zoom.pointHeight + '/,115/0/native.jpg'
    return thumbURL
  }

    /**
   * Generate Thumbnail URL
   * @param thumbData: AssetData | Thumbnail - returned by search service, metadata service, or group service
   * @param size: number - sizes 0 through 4 are acceptable
   */
  public makeThumbUrl(thumbData: any, size?: number): string {
    // console.log("MAKE URL", thumbData)
    let imagePath: string
    let isMultiView: boolean
    let isThumbnailImgUrl: boolean
    let isDowngradedMultiView: boolean
    let receivedFullUrl: boolean
    // Set default size
    if (!size) {
      size = 2
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
