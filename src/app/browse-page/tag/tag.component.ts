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

  @Input() public tag: Tag;
  @Input() public link: boolean;

  private showAsFolder: boolean;
  public linkRoute: string = "";
  public showDescription: boolean = false;
  private loading: boolean = false;

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
      if (this.tag.type.label === 'group' && this.tag.type.folder !== true) {
        this.linkRoute = '/group';
      }
      if (this.tag.type.label === 'category') {
        this.linkRoute = '/category';
      }
      if (this.tag.type.label === "subcategory") {
        this.linkRoute = '/subcategory';
      }
    }
  }

  toggleDescription(): void {
    this.showDescription = !this.showDescription;
  }

  /**
   * Collection/Category titles often have the count appended to the title
   * We want to remove these parantheses wrapping the count for:
   * - Cleaner formatting
   * - Simpler route behavior (can't pass paranthesis as a route)
   */
  private cleanTitle(title: string): string {
    return title.replace(/[\(\)]/g,'');
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
        this.loading = true;
        this._tags.getChildTags(this.tag)
          .then((tags) => {
            this.loading = false;
            this.tag.setChildren(tags);
          })
          .catch((err) => {
            this.loading = false;
            console.error(err);
          });
      }
    }
    
  }
}