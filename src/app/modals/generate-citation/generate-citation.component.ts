import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit, ElementRef, ViewChild  } from '@angular/core'
import { DatePipe, Location } from '@angular/common'

import { Asset } from '../../asset-page/asset'
import { LogService, DomUtilityService } from '../../shared'
import { AppConfig } from 'app/app.service';

@Component({
  selector: 'ang-generate-citation',
  templateUrl: 'generate-citation.component.pug',
  styleUrls: ['./generate-citation.component.scss']
})
export class GenerateCitation implements OnInit, AfterViewInit {
  @Output()
  public closeModal: EventEmitter<any> = new EventEmitter()

  @Input() private asset: Asset /** the asset in question */

  @ViewChild("modal", {read: ElementRef}) modalElement: ElementRef;

  // Prefer saving links to HTTPS
  private reqProtocol = 'https://'

  public apa_citation: string = '' // APA style citation to be copied to the clipboard
  public mla_citation: string = '' // MLA style citation to be copied to the clipboard
  public chicago_citation: string = '' // Chicago style citation to be copied to the clipboard
  public citationCopied: boolean = false
  // For client side, template use only
  public document = document

  constructor(
    private _date: DatePipe,
    private _log: LogService,
    private _dom: DomUtilityService,
    private location: Location,
    private _app: AppConfig
  ) { }

  ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    if (this.modalElement && this.modalElement.nativeElement){
      this.modalElement.nativeElement.focus()
    }

    this.generateCitations(this.asset)
    this._log.log({
      eventType: 'artstor_citation',
      item_id: this.asset.id
    })
  }

  ngAfterViewInit() {
    this.startModalFocus()
  }

  // Set initial focus on the modal Title h1
  public startModalFocus() {
    let modalStartFocus: HTMLElement = <HTMLElement>this._dom.byId('generate-citation-title')
    modalStartFocus.focus()
  }

  /**
   * Generates APA, MLA & Chicago style citations for the asset
   */
  private generateCitations(asset: Asset): void {
    // console.log(asset)

    let assetPath = 'asset/'

    // Note: The request protocol is added to ADA, and Chicago citations, but not MLA
    let currentUrl = this._app.clientHostname + this.location.path(false) + assetPath + asset.id

    // APA Citation
    // [Creator]. [Date(in parentheses)]. [Title(italicized)]. [Work Type(in brackets)]. Retrieved from [asset page url].
    if (this.getMetaValue('Creator')) {
      this.apa_citation += this.getMetaValue('Creator') + '. '
    }
    if (this.getMetaValue('Date')) {
      this.apa_citation += '(' + this.getMetaValue('Date') + '). '
    }
    if (this.getMetaValue('Title')) {
      this.apa_citation += this.getMetaValue('Title') + '. '
    }
    if (this.getMetaValue('Work Type')) {
      this.apa_citation += '[' + this.getMetaValue('Work Type') + ']. '
    }
    this.apa_citation += 'Retrieved from ' + this.reqProtocol + currentUrl


    // MLA Citation
    // [Creator]. [Title(italicized)]. [Date]. [Artstor], [asset page url starting with library (no http)].
    if (this.getMetaValue('Creator')) {
      this.mla_citation += this.getMetaValue('Creator') + '. '
    }
    if (this.getMetaValue('Title')) {
      this.mla_citation += this.getMetaValue('Title') + '. '
    }
    if (this.getMetaValue('Date')) {
      this.mla_citation += this.getMetaValue('Date') + '. '
    }

    this.mla_citation += 'Artstor, ' + currentUrl


    // Chicago Citation
    // [Creator]. [Date]. Title(italicized)]. [Work Type]. Place: [Repository]. [asset page url].
    if (this.getMetaValue('Creator')) {
      this.chicago_citation += this.getMetaValue('Creator') + '. '
    }
    if (this.getMetaValue('Date')) {
      this.chicago_citation += this.getMetaValue('Date') + '. '
    }
    if (this.getMetaValue('Title')) {
      this.chicago_citation += this.getMetaValue('Title') + '. '
    }
    if (this.getMetaValue('Work Type')) {
      this.chicago_citation += this.getMetaValue('Work Type') + '. '
    }
    if (this.getMetaValue('Repository')) {
      this.chicago_citation += 'Place: ' + this.getMetaValue('Repository') + '. '
    }
    this.chicago_citation += this.reqProtocol + currentUrl + '.'

  }

  /**
   * Extracts required metadata field value from the metadata array
   */
  private getMetaValue(field: string): string{
    let value: string = ''
    for (let property of Object.keys(this.asset.formattedMetadata)){
      let values = this.asset.formattedMetadata[property]
      if (property === field){
        for (let val of values){
          value += value ? ', ' + val : val
        }
        break;
      }
    }
    return value
  }
}
