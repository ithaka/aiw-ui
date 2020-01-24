import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit } from '@angular/core'

// Project Dependencies
import { DomUtilityService } from '../../_services/dom-utility.service'

@Component({
  selector: 'ang-loading-state',
  templateUrl: './loading-state.component.pug',
  styleUrls: ["./loading-state.component.scss"]
})
export class LoadingStateComponent implements OnInit, AfterViewInit {

  @Input()
  public options: LoadingStateOptions
  @Output()
  public closeModal: EventEmitter<any> = new EventEmitter()
  @Output()
  public triggerRetry: EventEmitter<any> = new EventEmitter()

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
    if (this.options.state === LoadingState.loading) {
      params['cancelExport'] = true
    }
    this.closeModal.emit(params)
  }

  public tryAgain(): void {
    this.triggerRetry.emit(this.options.exportType)
  }

}


export interface LoadingStateOptions {
  exportType: SupportedExportTypes,
  state: LoadingState,
  progress?: number // percentage value
  errorType?: string
}

export enum LoadingState {
  loading, // 0
  completed, // 1
  error // 2
}

export enum SupportedExportTypes {
  ZIP = 'zip',
  PPTX = 'pptx',
  GOOGLE_SLIDES = 'GoogleSlides'
}
