import { Component, OnInit, Input } from '@angular/core';

import { AssetService } from './../shared/assets.service';
import { Tag } from './tag';

@Component({
  selector: 'ang-tag',
  templateUrl: 'tag.component.html',
  styleUrls: ['./browse-page.component.scss']
})
export class TagComponent implements OnInit {

  @Input()
  public tag: Tag;
  private showAsFolder: boolean;

  constructor(private _assets: AssetService) {
  }

  ngOnInit() { 
    this.setFolderView()
  }

  private setFolderView() {
    console.log("setting folder view!");
    this.showAsFolder = (
      (this.tag.type.folder && !this.tag.touched)
      ||
      (this.tag.type.folder && this.tag.getChildren().length > 0) 
    );
  }

  private toggleFolder(tag: Tag) {

    // has the tag been opened before?
    if (!tag.touched) {
      //the tag doesn't have any children, so we run a call to get any
      let childArr: Tag[] = [];
      
      // logic determines which call to make, to categories or subcategories
      if (tag.type.label === "collection") {
        this._assets.category(tag.tagId)
          .then((data) => {
            for(let category of data.Categories) {
              let categoryTag = new Tag(category.widgetId, category.title, true, tag, { label: "category", folder: category.isFolder });
              childArr.push(categoryTag);
              // this.tags.splice(this.tags.indexOf(tag) + 1, 0, categoryTag);
            }
            tag.setChildren(childArr);
          })
          .catch((err) => {
            console.error(err);
          });
      } else if (tag.type.label === "category") {
        this._assets.subcategories(tag.tagId)
          .then((data) => {
            for(let category of data) {
              let categoryTag = new Tag(category.widgetId, category.title, true, tag, { label: "subcategory", folder: category.isFolder });
              childArr.push(categoryTag);
              // this.tags.splice(this.tags.indexOf(tag) + 1, 0, categoryTag);
            }
            tag.setChildren(childArr);
          })
          .catch((err) => {
            console.error(err);
          });
      }

    }
}