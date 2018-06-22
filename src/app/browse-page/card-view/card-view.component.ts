import { Thumbnail } from './../../shared/datatypes/thumbnail.interface';
import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TagFiltersService } from './tag-filters.service'
import { Tag } from '../tag/tag.class';
import { Subscription }   from 'rxjs/Subscription';
import { AssetService, AuthService } from '../../shared';
import { ImageGroupPPPage } from '../../image-group-pp-page'


import { ImageGroup, ImageGroupDescription, IgDownloadInfo, ImageGroupService, GroupService, AssetSearchService } from '../../shared';

@Component({
  selector: 'ang-card-view',
  styleUrls: ['./card-view.component.scss'],
  templateUrl: 'card-view.component.pug'
})
export class CardViewComponent implements OnInit {

  @Input() public tag: Tag;
  @Input() public group: any;
  @Input() public link: boolean;
  @Input() public descriptions: string[] = [];
  @Input() public browseLevel:string;

  public linkRoute: string = "";
  private user: any;
  private ig: ImageGroup = <ImageGroup>{};
  private igDescript: string = ''
  private tags: any[] = [];
  private thumbnails: any[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private _assets: AssetService,
    private _search: AssetSearchService,
    private _group: GroupService,
    private _router: Router,
    private route: ActivatedRoute,
    private _auth: AuthService,
    private _igService: ImageGroupService
  ){}

  ngOnInit() {
    this.user = this._auth.getUser();
    let id = null;
    //console.log("%%%",this.descriptions)
    //this.igDescript = this.descriptions[1]

    console.log("this is the group:", this.group)
    console.log("this is the tag:", this.tag)
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
        console.log("this is the thumbnails I have:", this.thumbnails)
      })
      .catch( error => {
        console.error(error);
      });


    //     let params = {'igId':this.group.id}
    //     this._assets.queryAll(params);

    // //this.subscriptions.push(
    //   this._assets.allResults.subscribe((results: ImageGroup) => {
    //     //console.log("this is the result:", results)
    //     if ('id' in results) {
    //       // Set ig properties from results
    //       this.ig = results;
    //       if(this.ig.description)
    //         this.igDescript = this.ig.description.substring(0,150)
    //       this.tags = this.ig.tags
    //       //console.log("!!!", this.ig)
    //     }
    //   })
    // //)
    //   //console.log("@@@",this.subscriptions)

  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
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