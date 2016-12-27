import { Component, Input } from '@angular/core';

import { AssetService } from '../../shared/assets.service';
import { TagsService } from '../tags.service';
import { Tag } from './tag.class';

@Component({
  selector: 'ang-tag',
  templateUrl: 'tag.component.html',
  styleUrls: ['./tag.component.scss']
})
export class TagComponent {

  @Input()
  public tag: Tag;
  private showAsFolder: boolean;
  public linkRoute: string = "";
  public showDescription: boolean = false;

  constructor(
    private _assets: AssetService, 
    private _tags: TagsService  
  ) {

  }

  ngOnInit() {
    if (this.tag.type) {
      if (this.tag.type.label === 'collection') {
        this.linkRoute = '/collection';
      }
      if (this.tag.type.label === 'group') {
        this.linkRoute = '/group';
      }
      if (this.tag.type.label === 'category' || this.tag.type.label === "subcategory") {
        this.linkRoute = '/category';
      }
    }
  }

  toggleDescription(): void {
    console.log("Toggle description!");
    console.log(this.tag);
    this.showDescription = !this.showDescription;
  }

  /**
   * Sends tag to tagService in order to retrieve and assign child tags
   */
  private getChildren(): void {
    // there is not a call to get anything for tags that are subcategories
    if (this.tag.type.label === "subcategory") {
      return;
    }
    // only want to make the http call once, and then the info will be stored on the tag
    if (!this.tag.touched) {
      //make sure the tag has a type and a type.label, which getTags uses as a switch
      if (this.tag.type && this.tag.type.label) {
        this._tags.getChildTags(this.tag)
          .then((tags) => {
            this.tag.setChildren(tags);
          })
          .catch((err) => {
            console.error(err);
          });
      }
    }
    
  }
}