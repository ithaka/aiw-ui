import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'

import { ImageGroup, GroupService } from './../../shared'

@Component({
  selector: 'ang-share-ig-link',
  templateUrl: 'share-ig-link.component.html',
  styleUrls: ['./share-ig-link.component.scss']
})
export class ShareIgLinkModal implements OnInit {
  @Output()
  private closeModal: EventEmitter<any> = new EventEmitter()

  @Input() private ig: ImageGroup /** the image group in question */

  private document = document

  private shareLink: string = "test" // this is the url which will be copied to the user's clipboard
  private igCopied: boolean = false

  constructor( private _group: GroupService ) { }

  ngOnInit() {
    this.shareLink = this.createIgLink(this.ig)
  }

  createIgLink(ig: ImageGroup): string {
    if (this.ig.public) { return ['http://', document.location.host, "/#/group/", ig.id].join("") }
    else {
      this._group.generateToken(this.ig.id, { access_type: 100 })
        .take(1)
        .subscribe((res) => {
          if (res.success && res.token) {
            return ['http://', document.location.host, "/#/group/redeem/", res.token].join("")
          }
        })
    }
  }
}