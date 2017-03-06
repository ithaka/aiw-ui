import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs/Rx';

import { AssetService } from './../../shared';

@Component({
  selector: 'ang-add-to-group',
  templateUrl: 'add-to-group.component.html'
})
export class AddToGroupModal implements OnInit, OnDestroy {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();
  private subscriptions: Subscription[] = [];

  private selectedAssets: any[] = [];
  private selectedIg: any;

  constructor(
    private _assets: AssetService
  ) { }

  ngOnInit() {
    // Subscribe to asset selection
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

  ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private onSubmit(value: any) {
    console.log(value);
  }
}