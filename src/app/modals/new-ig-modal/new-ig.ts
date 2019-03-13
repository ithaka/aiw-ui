import { ImageGroup } from './../../shared'

import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms'

/** DON'T ADD SERVICES TO THIS CLASS */
export class IgFormUtil {
  constructor() {}

  /**
   * Prepares and returns the image group object from the form
   * @param form The value of the submitted form
   * @param description The string value of the description pulled out of the medium editor
   * @param assets The array of assets (can be array of assets or of strings) which the image group should contain
   * @param user The current user
   * @param currentIg The ImageGroup which is currently being edited/copied (used for preparing the access object)
   * @returns ImageGroup which can be POSTed or PUT to the groups API
   */
  public prepareGroup(form: IgFormValue, description: string, assets: any[], user: any, currentIg?: ImageGroup): ImageGroup {
    let assetIdProperty = 'artstorid'

    /** format an array of asset ids out of the asset */
    let items = []
    assets.forEach(
      (item) => {

        let itemObj: any = {}

        if (item[assetIdProperty]) {
          itemObj.id = item[assetIdProperty] // sometimes this is an array of real assets
        }
        else if (item.objectId) {
          itemObj.id = item.objectId // sometimes assets are from legacy collection services
        }
        else if (item.id) {
          itemObj.id = item.id // sometimes this is an array of real assets
        } else {
          itemObj.id = item // sometimes though it's just an array of strings
        }

        if (item.detailViewBounds && item.detailViewBounds.width) {
          itemObj.zoom = ({
            "viewerX": Math.round(item.detailViewBounds['x']),
            "viewerY": Math.round(item.detailViewBounds['y']),
            "pointWidth": Math.round(item.detailViewBounds['width']),
            "pointHeight": Math.round(item.detailViewBounds['height']),
            "index": 0
          })
        }

        items.push(itemObj)
      }
    )

    /** Group creation should be factored into a function */
    let group = {
      name: form.title,
      description: description,
      sequence_number: 0,
      access: currentIg && currentIg.access ? currentIg.access : [ { // if the image group already exists, use that access object
        // This is the user's access object
        'entity_type': 100,
        'entity_identifier': user.baseProfileId.toString(),
        'access_type': 300
      } ],
      items: items,
      tags: form.tags
    }

    /** The access object for the user's institution */
    let institutionAccessObj = {
      entity_type: 200,
      entity_identifier: user && user.institutionId.toString(),
      access_type: 100
    }

    /**
     * Add institution access object if shared with Institution
     *  otherwise, remove the institution access obj (this won't fail if it doesn't exist, but will remove it if it does)
     */
    if (form.artstorPermissions == 'institution') {

      /** Assign institutional access only if the group doesn't have that already */
      let institutionAccessExists = false;
      group.access.forEach(
        (accessObj) => {
          if ((accessObj.entity_type == institutionAccessObj.entity_type) && (accessObj.entity_identifier == institutionAccessObj.entity_identifier) && (accessObj.access_type == institutionAccessObj.access_type)){
            institutionAccessExists = true;
          }
        }
      )
      if (!institutionAccessExists){
        group.access.push(institutionAccessObj)
      }
    } else {
      group.access = group.access.filter((item) => {
        return item.entity_identifier != institutionAccessObj.entity_identifier
      })
    }

    // Make sure to trim/remove the leading and trailing space from each tag
    for (let tag of group.tags){
      tag = tag.trim()
    }

    return group
  }
}

export interface IgFormValue {
  title: string,
  artstorPermissions: string,
  tags: string[]
}
