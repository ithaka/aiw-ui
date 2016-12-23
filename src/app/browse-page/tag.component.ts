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

  constructor() {
  }

  ngOnInit() { 
  }
}