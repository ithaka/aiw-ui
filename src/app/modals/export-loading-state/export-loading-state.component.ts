import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
// import { Observable } from 'rxjs';
// import { Angulartics2 } from 'angulartics2';

import { DomUtilityService } from './../../shared';
// import { SlidesService } from './../../_services'
// import { ArtstorStorageService } from '../../../../projects/artstor-storage/src/public_api';

@Component({
  selector: 'ang-export-loading-state',
  templateUrl: './export-loading-state.component.pug',
  styleUrls: ["./export-loading-state.component.scss"]
})
export class ExportLoadingStateComponent implements OnInit, AfterViewInit {

  @Input()
  public options: LoadingStateOptions
  @Output()
  public closeModal: EventEmitter<any> = new EventEmitter();


  constructor(
    private _dom: DomUtilityService
  ) {}

  ngOnInit() {
  }

  ngAfterViewInit() {
    // this.startModalFocus()
  }
  public startModalFocus() {
    let htmlelement: HTMLElement = <HTMLElement>this._dom.bySelector('.auth-btn .btn')
    htmlelement.focus()
  }
  public focusLastElement() {
    let htmlelement: HTMLElement = <HTMLElement>this._dom.bySelector('.close')
    htmlelement.focus()
  }

}


export interface LoadingStateOptions {
  exportType: string,
  state: LoadingState,
  progress: number // percentage value 
}

export enum LoadingState {
  loading, // 0
  completed, // 1
  error // 2
}