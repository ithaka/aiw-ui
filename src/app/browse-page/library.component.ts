import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from './../shared/assets.service';
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
    private _tags: TagsService
  ) { }

  private subscriptions: Subscription[] = [];

  private tags: Tag[] = [];

  private currentBrowseRes: any = {};
  private selectedBrowseId: string = '103';
  private browseMenuArray: any[] = [
    {
      label : 'Collection',
      id: '103'
    },
    {
      label : 'Classification',
      id: '250'
    },
    {
      label : 'Geography',
      id: '260'
    }
  ];

  ngOnInit() {
    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => { 
        if(params && params['viewId']){
            this.selectedBrowseId = params['viewId'];
        }
        this.loadCategory();
        this.getTags();
      })
    );
  }

  private getTags(): void {
    this._tags.initTags({ type: "library", collectionId: this.selectedBrowseId})
      .then((tags) => {
        console.log(tags);
        this.tags = tags;
      })
      .catch((err) => {
        console.error(err);
      });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Changes menu between ADL, University Collections, Open Collections, etc...
   * @param id Id of desired menu from colMenuArray enum
   */
  private selectBrowseOpt ( id: string ){
    this.selectedBrowseId = id;
    this.addRouteParam('viewId', id);
  }

  /**
   * Sets browser response for description
   */
  private loadCategory(): void{
    this._assets.category( this.selectedBrowseId )
      .then((res) => {
          this.currentBrowseRes = res;
      })
      .catch(function(err) {
          console.log('Unable to load category results.');
      });
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