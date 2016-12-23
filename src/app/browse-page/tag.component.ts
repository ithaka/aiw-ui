import { Component, OnInit, Input } from '@angular/core';

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

  constructor() {
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
}