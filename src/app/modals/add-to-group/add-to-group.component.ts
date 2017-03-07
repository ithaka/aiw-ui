import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs/Rx';

import { AssetService, GroupService, ImageGroup } from './../../shared';

@Component({
  selector: 'ang-add-to-group',
  templateUrl: 'add-to-group.component.html'
})
export class AddToGroupModal implements OnInit, OnDestroy {
  @Output() closeModal: EventEmitter<any> = new EventEmitter();
  private subscriptions: Subscription[] = [];

  private selectedAssets: any[] = [];
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

    this._group.getAll()
      .take(1)
      .subscribe((res) => { if (res.groups) { this.groups = res.groups; } }, (err) => { console.error(err); });
  }

  ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private onSubmit(form: NgForm) {
    this.serviceResponse = {}; // clear any service status

    console.log(this.groups);
    console.log(form.value.imageGroup);

    this._group.update(form.value.imageGroup)
      .take(1)
      .subscribe((res) => { console.log(res); }, (err) => { console.error(err); })
  }
}