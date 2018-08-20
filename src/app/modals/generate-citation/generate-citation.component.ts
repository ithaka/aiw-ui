import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { DatePipe } from '@angular/common'

import { Asset } from '../../asset-page/asset'
import { LogService } from '../../shared'

@Component({
  selector: 'ang-generate-citation',
  templateUrl: 'generate-citation.component.pug',
  styleUrls: ['./generate-citation.component.scss']
})
export class GenerateCitation implements OnInit {
  @Output()
  private closeModal: EventEmitter<any> = new EventEmitter()

  @Input() private asset: Asset /** the asset in question */

  private document = document

  private apa_citation: string = '' // APA style citation to be copied to the clipboard
  private mla_citation: string = '' // MLA style citation to be copied to the clipboard
  private chicago_citation: string = '' // Chicago style citation to be copied to the clipboard

  private citationCopied: boolean = false

  constructor(
    private _date: DatePipe,
    private _log: LogService
  ) { }

  ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    let htmlelement: HTMLElement = document.getElementById('modal');
    htmlelement.focus()

    this.generateCitations(this.asset)
    this._log.log({
      eventType: 'artstor_citation',
      item_id: this.asset.id
    })
  }

  /**
   * Generates APA, MLA & Chicago style citations for the asset
   */
  private generateCitations(asset: Asset): void {
    // console.log(asset)

    let assetPath
    if (window.location.host.indexOf('localhost:') > -1) {
      assetPath = '/#/asset/'
    } else {
      assetPath = '/asset/'
    }
    let currentUrl = [ 'http://', document.location.host, assetPath, asset.id ].join('')

    // APA Citation
    // [Creator]. [Date(in parentheses)]. [Title(italicized)]. [Work Type(in brackets)]. Retrieved from [asset page url].
    if ( this.getMetaValue('Creator') ){
      this.apa_citation += this.getMetaValue('Creator') + '. '
    }
    if ( this.getMetaValue('Date') ){
      this.apa_citation += '(' + this.getMetaValue('Date') + '). '
    }
    if ( this.getMetaValue('Title') ){
      this.apa_citation += this.getMetaValue('Title') + '. '
    }
    if ( this.getMetaValue('Work Type') ){
      this.apa_citation += '[' + this.getMetaValue('Work Type') + ']. '
    }
    this.apa_citation += 'Retrieved from ' + currentUrl


    // MLA Citation
    // [Creator]. [Title(italicized)]. [Date]. [Repository]. [asset page url]. Web. [Today's date ex: 1 Nov 2017].
    // let today = Date.now();
    if ( this.getMetaValue('Creator') ){
      this.mla_citation += this.getMetaValue('Creator') + '. '
    }
    if ( this.getMetaValue('Title') ){
      this.mla_citation += '<i>' + this.getMetaValue('Title') + '</i>. '
    }
    if ( this.getMetaValue('Date') ){
      this.mla_citation += this.getMetaValue('Date') + '. '
    }

    this.mla_citation += '<i>Artstor</i>, ' + currentUrl

    // if ( this.getMetaValue('Repository') ){
    //   this.mla_citation += this.getMetaValue('Repository') + '. '
    // }
    // this.mla_citation += currentUrl + '. Web. ' + this._date.transform(today, 'd MMM y') + '.'


    // Chicago Citation
    // [Creator]. [Date]. Title(italicized)]. [Work Type]. Place: [Repository]. [asset page url].
    if ( this.getMetaValue('Creator') ){
      this.chicago_citation += this.getMetaValue('Creator') + '. '
    }
    if ( this.getMetaValue('Date') ){
      this.chicago_citation += this.getMetaValue('Date') + '. '
    }
    if ( this.getMetaValue('Title') ){
      this.chicago_citation += this.getMetaValue('Title') + '. '
    }
    if ( this.getMetaValue('Work Type') ){
      this.chicago_citation += this.getMetaValue('Work Type') + '. '
    }
    if ( this.getMetaValue('Repository') ){
      this.chicago_citation += 'Place: ' + this.getMetaValue('Repository') + '. '
    }
    this.chicago_citation += currentUrl + '.'

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
