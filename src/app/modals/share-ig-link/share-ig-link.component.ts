import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'

import { ImageGroup, GroupService, AuthService } from './../../shared'

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

  private shareLink: string = "" // this is the url which will be copied to the user's clipboard
  private igCopied: boolean = false
  private serviceStatus: {
    isLoading?: boolean,
    tokenError?: boolean
  } = {}

  constructor( private _group: GroupService, private _auth: AuthService ) { }

  ngOnInit() {
    this.createIgLink(this.ig)
  }

  createIgLink(ig: ImageGroup): void {
    // Find out if group is owned by user
    let userOwned = false
    let user = this._auth.getUser()
    this.ig.access.forEach((accessObj) => {
      if((accessObj.entity_identifier == user.baseProfileId.toString() && accessObj.access_type == 300) ){
        userOwned = true
      }
    })

    let groupPath
    if (window.location.host.indexOf('proxy') > -1) {
      groupPath = '/group/'
    } else {
      groupPath = '/#/group/'
    }

    // If the group is not owned by the user, we simply give back the url of the group
    // Only a group owner can generate a token share link
    if (!userOwned) { 
      this.shareLink = ['http://', document.location.host, groupPath, ig.id].join("") 
    } else {
      // if the image group is private, we call a service to generate a token, then attach that to the route so the user can share it
      this.serviceStatus.isLoading = true
      this._group.generateToken(this.ig.id, { access_type: 100 })
        .take(1)
        .subscribe((res) => {
          this.serviceStatus.isLoading = false
          if (res.success && res.token) {
            this.shareLink = ['http://', document.location.host, groupPath, ig.id, "?token=", res.token].join("")
          } else {
            this.serviceStatus.tokenError = true
          }
        }, (err) => {
          console.error(err)
          this.serviceStatus.tokenError = true
        })
    }
  }
}