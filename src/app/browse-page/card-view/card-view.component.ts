import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Thumbnail } from './../../shared/datatypes/thumbnail.interface';
import { Tag } from '../tag/tag.class';
import { AssetService, AssetSearchService } from '../../shared';

@Component({
  selector: 'ang-card-view',
  styleUrls: ['./card-view.component.scss'],
  templateUrl: 'card-view.component.pug'
})
export class CardViewComponent implements OnInit {

  @Input() public tag: Tag;
  @Input() public group: any;
  @Input() public browseLevel:string;
  @Input() public link: boolean;

  public linkRoute: string = "";
  private tags: any[] = [];
  private thumbnails: any[] = [];
  private type: string = "-";

  constructor(
    private _search: AssetSearchService,
    private _assets: AssetService,
    private _router: Router,
    private route: ActivatedRoute
  ){}

  ngOnInit() {
    if (this.browseLevel === 'private') {
      this.type = 'Private';
    }
    else if (this.browseLevel === 'institution') {
      this.type = 'Institutional';
    }
    else if (this.browseLevel === 'public') {
      this.type = 'Artstor Curated';
    }
    else if (this.browseLevel === 'shared') {
      this.type = 'Shared with Me';
    }

    if (this.tag.type) {
      if (this.tag.type.label === 'collection') {
        this.linkRoute = '/collection';
      }
      if (this.tag.type.label === 'pcollection' || this.tag.type.label === 'privateCollection') {
        this.linkRoute = '/pcollection';
      }
      if (this.tag.type.label === 'group' && this.tag.type.folder !== true) {
        this.linkRoute = '/group';
      }
      if (this.tag.type.label === 'category') {
        this.linkRoute = '/category';
      }
    }

    let itemIds: string[] = this.group.items.slice(0,3)
    this._assets.getAllThumbnails(itemIds)
      .then( allThumbnails => {
        this.thumbnails = allThumbnails;
      })
      .catch( error => {
        console.error(error);
      });
  }

  private selectTag(tag:string) {
    this.updateUrl(encodeURIComponent(tag))
  }

  /** Updates the url to contain all of the selected filters */
  private updateUrl(tag: string): void {
    let queryParams: any = Object.assign({}, this.route.snapshot.queryParams)
    delete queryParams['tags']
    queryParams = Object.assign({}, {'tags': tag})

    this._router.navigate(['/browse','groups', this.browseLevel], { queryParams: queryParams })
  }

}