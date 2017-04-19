import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs/Rx';

import { AssetService, GroupService, ImageGroup } from './../../shared';

@Component({
  selector: 'ang-add-to-group',
  templateUrl: 'add-to-group.component.html'
})
export class AddToGroupModal implements OnInit, OnDestroy {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();
  @Output() createGroup: EventEmitter<any> = new EventEmitter();
  @Input() showCreateGroup: boolean = false;
  private subscriptions: Subscription[] = [];

  @Input() private selectedAssets: any[] = []; // this is used in the asset page, where a single asset can be injected directly
  private groups: ImageGroup[] = [];
  private selectedIg: ImageGroup;

  private serviceResponse: {
    success?: boolean,
    failure?: boolean
  } = {};

  constructor(
    private _assets: AssetService,
    private _group: GroupService
  ) { }

  ngOnInit() {
    console.log(this.selectedAssets);
    if (this.selectedAssets.length < 1) { // if no assets were added when component was initialized, the component gets the current selection list
      // Subscribe to asset selection
      console.log("we've got to get the assets");
      this.subscriptions.push(
        this._assets.selection.subscribe(
          assets => {
            this.selectedAssets = assets;
          },
          error => {
            console.error(error);
          }
        )
      );
    }

    this._group.getAll('private')
      .take(1)
      .subscribe((res) => { if (res.groups) { this.groups = res.groups; } }, (err) => { console.error(err); });
  }

  ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private onSubmit(form: NgForm) {
    this.serviceResponse = {}; // clear any service status

    this.selectedIg = form.value.imageGroup;
    let putGroup: ImageGroup = <ImageGroup>{};
    Object.assign(putGroup, form.value.imageGroup);

    // assets come from different places and sometimes have id and sometimes objectId
    this.selectedAssets.forEach((asset: any) => {
      if (asset && asset.id) {
        if (putGroup.items.indexOf(asset.id) < 0) {
          putGroup.items.push(asset.id);
        }
      } else if (asset && asset.objectId) {
        if (putGroup.items.indexOf(asset.objectId) < 0) {
          putGroup.items.push(asset.objectId);
        }
      }
    });

    // this._group.get(this.selectedIg.id)
    //   .subscribe(res => {
    //     console.log(res);
    //   }
    // );

    this._group.get(this.selectedIg.id)
      .toPromise()
      .then((data) => { return this.extractData(data); })
      .then((data) => { 
        console.log(data);
        data.items = putGroup.items;

        this._group.update(data)
          .take(1)
          .subscribe(
            (res) => { this.serviceResponse.success = true; },
            (err) => { console.error(err); this.serviceResponse.failure = true;
          })

      })
      .catch((error) => {
          console.error(error);
      });

    
  }

  private extractData(res: any) {
      let body = res.json();
      return body || { };
  }
}