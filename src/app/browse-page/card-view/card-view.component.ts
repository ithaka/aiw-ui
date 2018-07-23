import { Component, OnInit, Input } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'
import { Tag } from '../tag/tag.class'
import { AssetService, AssetSearchService, AuthService, } from '../../shared'
import { GroupQuery } from './../browse-groups/groups.component'

@Component({
  selector: 'ang-card-view',
  styleUrls: ['./card-view.component.scss'],
  templateUrl: 'card-view.component.pug'
})
export class CardViewComponent implements OnInit {

  @Input() public tag: Tag
  @Input() public group: any
  @Input() public browseLevel:string
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
    this.description = this.group.description ? this.group.description.replace(/(<([^>]+)>)/ig,"") : ''
    this.description = this.description.length>150 ? this.description.slice(0,150) + '...' : this.description

    // For institutional page, show everything as institutional
    if (this.browseLevel === 'institution') {
      this.groupType = 'Institutional'
    }
    // For public page, show everything as public
    else if (this.browseLevel === 'public') {
      this.groupType = 'Artstor Curated'
    }
    // For shared with me page, show everything as shared with me
    else if (this.browseLevel === 'shared') {
      this.groupType = 'Shared with Me'
    }
    // For private and search page
    else {
      if (this.group.public === true) {
        this.groupType = 'Artstor Curated'
      }
      // If I am the owner of the image group, group_type 100 means I make it to be private, group_type 200 means I make it to be institutional
      else if (this.group.owner_id === this._auth.getUser().baseProfileId.toString()) {
        if (this.group.group_type && this.group.group_type === 100) {
          this.groupType = 'Private'
        }
        else if (this.group.group_type && this.group.group_type === 200) {
          this.groupType = 'Shared'
        }
      }
      // If I am NOT the owner of the image group, group_type 100 means its owner makes it private and I can see it because it is shared with me, group_type 200 means its owner makes it institutional 
      else if (this.group.owner_id !== this._auth.getUser().baseProfileId.toString()) {
        if (this.group.group_type && this.group.group_type === 100) {
          this.groupType = 'Shared with Me'
        }
        else if (this.group.group_type && this.group.group_type === 200) {
          this.groupType = 'Institutional'
        }
      }
    }

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
    let itemIds: string[] = this.group.items.slice(0,3)
    this._assets.getAllThumbnails(itemIds)
      .then( allThumbnails => {
        this.thumbnails = allThumbnails
      })
      .catch( error => {
        console.error(error)
      })
  }

  private selectTag(tag:string) {
    this.updateUrl(encodeURIComponent(tag))
  }

  /** Updates the url to contain all of the selected filters */
  private updateUrl(tag: string): void {
    let queryParams: any = Object.assign({}, this.route.snapshot.queryParams)
    delete queryParams['tags']
    queryParams = Object.assign(queryParams, {'tags': tag})

    this._router.navigate(['/browse','groups', this.browseLevel], { queryParams: queryParams })
  }

  /** Implement the search of owner by owner_id */
  private searchOwner(imageGroup: any): void {
    let queryParams: GroupQuery = Object.assign({}, this.route.snapshot.queryParams)
    queryParams.level = 'all'
    delete queryParams['term']
    queryParams = Object.assign({}, {'term': imageGroup.owner_name, 'id': imageGroup.owner_id})
    this._router.navigate(['/browse','groups'], { queryParams: queryParams })
  }

}