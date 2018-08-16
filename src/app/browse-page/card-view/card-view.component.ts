import { Component, OnInit, Input } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'

import { Tag } from '../tag/tag.class'
import { AssetService, AssetSearchService, AuthService } from '../../shared'
import { GroupQuery } from './../browse-groups/groups.component'

@Component({
  selector: 'ang-card-view',
  styleUrls: ['./card-view.component.scss'],
  templateUrl: 'card-view.component.pug'
})
export class CardViewComponent implements OnInit {

  @Input() public tag: Tag
  @Input() public group: any
  @Input() public browseLevel: string
  @Input() public link: boolean

  public linkRoute: string = ''
  private tags: any[] = []
  private thumbnails: any[] = []
  private groupType: string = '-'
  private description: string = ''

  constructor(
    private _auth: AuthService,
    private _search: AssetSearchService,
    private _assets: AssetService,
    private _router: Router,
    private route: ActivatedRoute
  ){}

  ngOnInit() {
    // Remove the html format from description and truncate it if it's more than 150 characters long
    this.description = this.group.description ? this.group.description.replace(/(<([^>]+)>)/ig, '') : ''
    this.description = this.description.length > 150 ? this.description.slice(0, 150) + '...' : this.description

    // Decide the group type showed in the cardview
    this.groupType = this.decideGroupType(this.browseLevel, this.group)

    if (this.tag.type) {
      if (this.tag.type.label === 'collection') {
        this.linkRoute = '/collection'
      }
      if (this.tag.type.label === 'pcollection' || this.tag.type.label === 'privateCollection') {
        this.linkRoute = '/pcollection'
      }
      if (this.tag.type.label === 'group' && this.tag.type.folder !== true) {
        this.linkRoute = '/group'
      }
      if (this.tag.type.label === 'category') {
        this.linkRoute = '/category'
      }
    }

    // Get the first three images of the image group to show on the card view
    let itemIds: string[] = this.group.items.slice(0, 3)
    this._assets.getAllThumbnails(itemIds)
      .then( allThumbnails => {
        this.thumbnails = allThumbnails
      })
      .catch( error => {
        console.error(error)
      })
  }

  /**
   * Decide the group type to show in the cardview
   * @param browseLevel the browse level: all, created, private, shared_by_me, institution, shared, public
   * @param group the current group object we want to show in this cardview
   */
  private decideGroupType(browseLevel: string, group: any) : string {
    // For institutional page, show everything as institutional
    if (browseLevel === 'institution') {
      return 'Institutional'
    }
    // For public page, show everything as public
    else if (browseLevel === 'public') {
      return 'Artstor Curated'
    }
    // For shared_with_me page, show everything as shared with me
    else if (browseLevel === 'shared') {
      return 'Shared with Me'
    }
    // For private page, show everything as private
    else if (browseLevel === 'private') {
      return 'Private'
    }
    // For shared_by_me page, if group_type 100, it is shared privately, otherwise it is shared with institution
    else if (browseLevel === 'shared_by_me') {
      if (group.group_type && group.group_type === 100) {
        return 'Shared Privately'
      }
      else if (group.group_type && group.group_type === 200) {
        return 'Shared Institutionally'
      }
    }
    // For private and search page
    else {
      if (group.public === true) {
        return 'Artstor Curated'
      }
      // If I am the owner of the image group, group_type 100 means I make it to be private, group_type 200 means I make it to be institutional
      // Some of the groups have multiple owners, so there is possibility that the owner_id is not equal to baseProfileId but it is still my group.
      // To prevent it to be showed as "Shared with Me", as long as on created level, show either "Private" or "Shared"
      else if (browseLevel === 'created' || group.owner_id === this._auth.getUser().baseProfileId.toString()) {
        if (group.group_type && group.group_type === 100) {
          return 'Private'
        }
        else if (group.group_type && group.group_type === 200) {
          return 'Shared'
        }
      }
      // If I am NOT the owner of the image group, group_type 100 means its owner makes it private and I can see it because it is shared with me, group_type 200 means its owner makes it institutional 
      else if (this.group.owner_id !== this._auth.getUser().baseProfileId.toString()) {
        if (this.group.group_type && this.group.group_type === 100) {
          return 'Shared with Me'
        }
        else if (this.group.group_type && this.group.group_type === 200) {
          return 'Institutional'
        }
      }
    }
  }

  private selectTag(tag: string) : void {
    this.updateUrl(encodeURIComponent(tag))
  }

  /** Updates the url to contain all of the selected filters */
  private updateUrl(tag: string): void {
    let queryParams: any = Object.assign({}, this.route.snapshot.queryParams)

    // Set page number to 1 to make sure applying and clearing tags from pages >= 2 should land the user on page 1 to show results
    queryParams.page = '1'

    delete queryParams['tags']
    queryParams = Object.assign(queryParams, {'tags': tag})

    this._router.navigate(['/browse', 'groups'], { queryParams: queryParams })
  }

  /** Implement the search of owner by owner_id */
  private searchOwner(imageGroup: any): void {
    let queryParams: GroupQuery = Object.assign({}, this.route.snapshot.queryParams)
    queryParams.level = 'all'
    delete queryParams['term']
    Object.assign(queryParams, {'term': imageGroup.owner_name, 'id': imageGroup.owner_id})
    this._router.navigate(['/browse', 'groups'], { queryParams: queryParams })
  }

}