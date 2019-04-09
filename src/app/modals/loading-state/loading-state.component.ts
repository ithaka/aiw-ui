import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
// import { Observable } from 'rxjs';
// import { Angulartics2 } from 'angulartics2';

import { DomUtilityService } from '../../shared';
// import { SlidesService } from './../../_services'
// import { ArtstorStorageService } from '../../../../projects/artstor-storage/src/public_api';

@Component({
  selector: 'ang-loading-state',
  templateUrl: './loading-state.component.pug',
  styleUrls: ["./loading-state.component.scss"]
})
export class LoadingStateComponent implements OnInit, AfterViewInit {

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
    this.startModalFocus()
  }
  public startModalFocus() {
    let htmlelement: HTMLElement = <HTMLElement>this._dom.bySelector('.progress')
    htmlelement.focus()
  }
  public focusLastElement() {
    let htmlelement: HTMLElement = <HTMLElement>this._dom.bySelector('.close')
    htmlelement.focus()
  }

  public close(): void {
    let params: any = {}
    if(this.options.state === LoadingState.loading) {
      params['cancelExport'] = true
    }
    this.closeModal.emit(params)
  }

}


export interface LoadingStateOptions {
  exportType: string,
  state: LoadingState,
  progress?: number // percentage value 
  errorType?: string
}

export enum LoadingState {
  loading, // 0
  completed, // 1
  error // 2
}