import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Angulartics2 } from 'angulartics2';

import { AssetService, AuthService, ImageGroup, DomUtilityService } from './../../shared';
import { ArtstorStorageService } from '../../../../projects/artstor-storage/src/public_api';

@Component({
  selector: 'ang-terms-and-conditions',
  templateUrl: './terms-and-conditions.component.pug',
  styles: [`
  .modal {
    display: block;
  }
`]
})
export class TermsAndConditionsComponent implements OnInit, AfterViewInit {

  /** Meant only to trigger display of modal */
  @Output()
  public closeModal: EventEmitter<any> = new EventEmitter();
  @Input()
  public ig: ImageGroup;
  @Input()
  public exportType: string;

  @ViewChild("ig-download-title", {read: ElementRef}) downloadTitleElement: ElementRef;

  public isLoading: boolean = false;
  public zipLoading: boolean = false;
  public downloadLink: string = '';
  public zipDownloadLink: string = '';
  public error: boolean = false;
  private downloadTitle: string = 'Image Group';
  private allowedDownloads: number = 0;

  private header = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
  private defaultOptions = { withCredentials: true};

  constructor(
    private _assets: AssetService,
    private _auth: AuthService,
    private _angulartics: Angulartics2,
    private _dom: DomUtilityService,
    private _storage: ArtstorStorageService,
    private http: HttpClient,
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.startModalFocus()
  }
  // Set initial focus on the modal Title h4
  public startModalFocus() {
    let htmlelement: HTMLElement = <HTMLElement>this._dom.byId('term-condition-title');
    htmlelement.focus()

    if (this.downloadTitleElement && this.downloadTitleElement.nativeElement){
      this.downloadTitleElement.nativeElement.focus()
    }
  }

  /**
   * When user click I agree, set session storage to make the modal appear once per session
   * Then trigger download process
   * @param event needed by hideModal()
   */
  private termAgreed(event: any) {
    // Set session storage
    this._storage.setSession('termAgreed', true)
    this.hideModal(this.exportType)
  }

  // Closes the IG T&C modal and passes the exportType back to parent component
  public hideModal(event: any): void {
    this.closeModal.emit(event)
  }
}