import { Component, OnInit, Input, OnChanges } from '@angular/core';

//import { Thumbnail, AssetService, CollectionTypeHandler, AssetSearchService, CollectionTypeInfo } from './../../shared'

@Component({
  selector: 'ang-prompt',
  templateUrl: 'prompt.component.pug',
  styles: [`
  .prompt-box {
    box-shadow: 0px 1px 7px 1px #80808052;
    padding: 0.8rem;
    border-radius: 3px;
    font-size: 0.9rem;
    line-height: 120%;
  }

  #promptImg1 {
    position: relative;
    right: 8rem;
    height: 5rem;
    margin-bottom: -6rem;
    margin-top: -5rem;
  }

  #promptImg2 {
    position: relative;
    right: 5rem;
    height: 8rem;
    margin-top: -13rem;
    margin-bottom: -9rem;
  }

  #promptImg3 {
    position: relative;
    right: 0rem;
    height: 7rem;
    margin-top: -15rem;
    margin-bottom: -10rem;
  }
  `]
})
export class PromptComponent implements OnInit, OnChanges {
  @Input()
  private searchTerm: string;

  private displayWords: string;

  ngOnInit() {
    if (window.location.href.indexOf('search') < 1 || this.searchTerm == "*") {
      this.displayWords = "Search across more than 2 million images in the Artstor Digital Library."
    }
    else {
      this.displayWords = "Search for “" + this.searchTerm + "” across over 2 million assets in Artstor Digital Library."
    }
  } 

  ngOnChanges() {
    if (window.location.href.indexOf('search') < 1 || this.searchTerm == "*") {
      this.displayWords = "Search across more than 2 million images in the Artstor Digital Library."
    }
    else {
      this.displayWords = "Search for “" + this.searchTerm + "” across over 2 million assets in Artstor Digital Library."
    }
  }
}
