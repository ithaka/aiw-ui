import { Component, OnInit, Input } from '@angular/core';

import { AssetService } from './../shared/assets.service';
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

  constructor() {
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
}