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
  private serviceStatus: {
    isLoading?: boolean,
    tokenError?: boolean
  } = {}

  constructor( private _group: GroupService ) { }

  ngOnInit() {
    this.shareLink = this.createIgLink(this.ig)
  }

  createIgLink(ig: ImageGroup): string {
    // if the group is public, we simply give back the url of the group
    if (this.ig.public) { return ['http://', document.location.host, "/#/group/", ig.id].join("") }
    else {
      // if the image group is private, we call a service to generate a token, then attach that to the route so the user can share it
      this.serviceStatus.isLoading = true
      this._group.generateToken(this.ig.id, { access_type: 100 })
        .take(1)
        .subscribe((res) => {
          this.serviceStatus.isLoading = false
          if (res.success && res.token) {
            return ['http://', document.location.host, "/#/group/redeem/", res.token].join("")
          } else {
            this.serviceStatus.tokenError = true
          }
        })
    }
  }
}