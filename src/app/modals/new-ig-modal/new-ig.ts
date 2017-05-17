import { ImageGroup } from './../../shared'

import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms'

export class IgFormUtil {
  constructor() {}

  // /**
  //  * Prepares and returns the image group object from the form
  //  * @param form The value of the submitted form
  //  * @param description The string value of the description pulled out of the medium editor
  //  */
  // private prepareGroup(form: FormValue, description: string): ImageGroup {
    
  // }

  // /**
  //  * Process the string put into the medium editor and return a prettier description string
  //  */
  // private extractDescription(mediumDesc: string): string {

  // }

  // /**
  //  * Sets the values of the new image group form based on a pre-existing image group
  //  * @param ig Image group to base the values off of
  //  */
  // private setFormValues(ig: ImageGroup): void {
    
  // }
}

interface FormValue {
  title: string,
  artstorPermissions: string,
  public: boolean,
  tags: string[]
}