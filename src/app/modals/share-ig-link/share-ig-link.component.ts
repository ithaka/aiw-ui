import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit } from '@angular/core'
import { map, take } from 'rxjs/operators'

import { ImageGroup, GroupService, AuthService, LogService } from './../../shared'

@Component({
  selector: 'ang-share-ig-link',
  templateUrl: 'share-ig-link.component.pug',
  styleUrls: ['./share-ig-link.component.scss']
})
export class ShareIgLinkModal implements OnInit, AfterViewInit {
  @Output()
  public closeModal: EventEmitter<any> = new EventEmitter()

  public document = document

  public shareLink: string = '' // this is the url which will be copied to the user's clipboard
  public igCopied: boolean = false
  public serviceStatus: {
    isLoading?: boolean,
    tokenError?: boolean
  } = {}

  @Input() private ig: ImageGroup /** the image group in question */

  constructor(
    private _group: GroupService,
    private _auth: AuthService,
    private _log: LogService
  ) { }

  ngOnInit() {
    this.createIgLink(this.ig)
    this._log.log({
      eventType: 'artstor_group_link',
      item_id: this.ig.id
    })
  }

  ngAfterViewInit() {
    this.startModalFocus()
  }

  // Set initial focus on the modal Title h1
  public startModalFocus() {
    // TO-DO: Only reference document client-side
    // let modalStartFocus = document.getElementById('share-ig-link-title')
    // modalStartFocus.focus()
  }

  createIgLink(ig: ImageGroup): void {
    // Find out if group is owned by user
    let userOwned = false
    let user = this._auth.getUser()
    let protocol = location.protocol + '//'
    this.ig.access.forEach((accessObj) => {
      if ((accessObj.entity_identifier == user.baseProfileId.toString() && accessObj.access_type == 300) ){
        userOwned = true
      }
    })

    let groupPath
    if (window.location.host.indexOf('localhost:') > -1) {
      groupPath = '/#/group/'
    } else {
      groupPath = '/group/'
    }

    // If the group is not owned by the user, we simply give back the url of the group
    // Only a group owner can generate a token share link
    if (!userOwned) {
      // TO-DO: Only reference document client-side
      // this.shareLink = [protocol, document.location.host, groupPath, ig.id].join('')
    } else {
      // if the image group is private, we call a service to generate a token, then attach that to the route so the user can share it
      this.serviceStatus.isLoading = true
      this._group.generateToken(this.ig.id, { access_type: 100 }).pipe(
        take(1),
        map(res => {
          this.serviceStatus.isLoading = false
          if (res.success && res.token) {
            // TO-DO: Only reference document client-side
            // this.shareLink = [protocol, document.location.host, groupPath, ig.id, '?token=', encodeURIComponent(res.token)].join('')
          } else {
            this.serviceStatus.tokenError = true
          }
        }, (err) => {
          console.error(err)
          this.serviceStatus.tokenError = true
      })).subscribe()
    }
  }
}
