import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'ang-collection-badge',
  templateUrl: 'collection-badge.component.pug',
  styleUrls: ['./collection-badge.component.scss']
})

export class CollectionBadgeComponent implements OnInit {
  @Input() collectionType: {
    name: string,
    alt: string
  }

  constructor() { }

  ngOnInit() {
    if (!this.collectionType) {
      console.error('no collectionType assigned to collection badge!')
    }
  }
}