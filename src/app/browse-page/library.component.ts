import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from './../shared/assets.service';
import { AnalyticsService } from '../analytics.service';
import { TagsService } from './tags.service';
import { Tag } from './tag/tag.class';

@Component({
  selector: 'ang-lib',
  templateUrl: 'library.component.html',
  styleUrls: [ './browse-page.component.scss' ]
})
export class LibraryComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private _assets: AssetService,
    private _tags: TagsService,
    private _analytics: AnalyticsService
  ) { }

  private subscriptions: Subscription[] = [];
  private selectedBrowseId: string = '';
  private browseMenuArray: any[] = [
    {
      label : 'Collection',
      id: '103',
    },
    {
      label : 'Classification',
      id: '250'
    },
    {
      label : 'Geography',
      id: '260'
    },
    {
      label : 'Teaching Resources',
      id: '270'
    }
  ];

  private tagsObj: any = {
    103 : [],
    250 : [],
    260 : [],
    270 : []
  };
  private descObj: any  = {};

  ngOnInit() {
    if (!this.route.snapshot.params['viewId']) {
      this.selectedBrowseId = "103";
      this.getTags(this.selectedBrowseId);
    }

    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => { 
        if(params && params['viewId']){
            if (this.selectedBrowseId !== params['viewId']){
              this.getTags(params['viewId']);
            }
            this.selectedBrowseId = params['viewId'];
        }
        this.loadDescription(this.selectedBrowseId);
      })
    );
    this._analytics.setPageValues('library', '')
  } // OnInit

  private getTags(browseId): void {
    if (!this.tagsObj[browseId] || this.tagsObj[browseId].length < 1) {
      this._tags.initTags({ type: "library", collectionId: browseId})
      .then((tags) => {
        this.tagsObj[browseId] = tags;
      })
      .catch((err) => {
        console.error(err);
      });
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Changes menu between ADL, University Collections, Open Collections, etc...
   * @param id Id of desired menu from colMenuArray enum
   */
  private selectBrowseOpt ( id: string ){
    this.getTags(id);
    this.selectedBrowseId = id;
    this.addRouteParam('viewId', id);
  }

  /**
   * Sets browser response for description
   */
  private loadDescription(browseId): void{
    if (!this.descObj[browseId]) {
      this._assets.category( browseId )
        .then((res) => {
            this.descObj[browseId] = res;
        })
        .catch(function(err) {
            console.log('Unable to load category results.');
        });
    }
  }

    /**
   * Adds a parameter to the route and navigates to new route
   * @param key Parameter you want added to route (as matrix param)
   * @param value The value of the parameter
   */
  private addRouteParam(key: string, value: any) {
    let currentParamsObj: Params = Object.assign({}, this.route.snapshot.params);
    currentParamsObj[key] = value;

    this.router.navigate([currentParamsObj], { relativeTo: this.route });
  }
}