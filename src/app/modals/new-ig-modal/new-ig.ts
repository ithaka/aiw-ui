import { ImageGroup } from './../../shared'

import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms'

/** DON'T ADD SERVICES TO THIS CLASS */
export class IgFormUtil {
  constructor() {}

  /**
   * Prepares and returns the image group object from the form
   * @param form The value of the submitted form
   * @param description The string value of the description pulled out of the medium editor
   */
  public prepareGroup(form: IgFormValue, description: string, assets: any[], user: any, currentIg?: ImageGroup): ImageGroup {
    /** format an array of asset ids out of the asset */
    let itemIds = []
    assets.forEach(
      (item) => {
        if (item.objectId) {
          itemIds.push(item.objectId) // sometimes this is an array of real assets
        } 
        else if(item.id) {
          itemIds.push(item.id) // sometimes this is an array of real assets
        } else {
          itemIds.push(item) // sometimes though it's just an array of strings
        }
      }
    )

    /** Group creation should be factored into a function */
    let group = {
      name: form.title,
      description: description,
      sequence_number: 0,
      access: currentIg ? currentIg.access : [ { // if the image group already exists, use that access object
        // This is the user's access object
        "entity_type": 100,
        "entity_identifier": user.baseProfileId.toString(),
        "access_type": 300
      } ],
      items: itemIds,
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
    if (form.artstorPermissions == "institution") {
      group.access.push(institutionAccessObj)
    } else {
      group.access = group.access.filter((item) => {
        return item.entity_identifier != institutionAccessObj.entity_identifier
      })
    }

    return group
  }
}

export interface IgFormValue {
  title: string,
  artstorPermissions: string,
  tags: string[]
}