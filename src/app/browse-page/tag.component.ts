import { Component, OnInit, Input } from '@angular/core';

import { AssetService } from './../shared/assets.service';
import { TagsService } from './tags.service';
import { Tag } from './tag.class';

@Component({
  selector: 'ang-tag',
  templateUrl: 'tag.component.html',
  styleUrls: ['./browse-page.component.scss']
})
export class TagComponent implements OnInit {

  @Input()
  public tag: Tag;
  private showAsFolder: boolean;

  constructor(
    private _assets: AssetService, 
    private _tags: TagsService  
  ) {
  }

  ngOnInit() { 
    this.setFolderView()
  }

  private setFolderView() {
    this.showAsFolder = (
      (this.tag.type.folder && !this.tag.touched)
      ||
      (this.tag.type.folder && this.tag.getChildren().length > 0) 
    );
  }

  private getChildren() {
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