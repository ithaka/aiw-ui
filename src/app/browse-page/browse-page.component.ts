import { Component } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';
import { AssetService } from '../shared/assets.service';

@Component({
  selector: 'ang-browse-page', 
  providers: [],
  styleUrls: [ './browse-page.component.scss' ],
  templateUrl: './browse-page.component.html'
})

export class BrowsePage {
  private subscriptions: Subscription[] = [];
  colMenuArray = [
      {
          label : 'Artstor Digital Library',
          id: '1'
      },
      {
          label : 'Sample U Collections',
          id: '2'
      },
      {
          label : 'Open Collections',
          id: '3'
      },
      {
          label : 'My Collections',
          id: '4'
      },
      {
          label : 'Groups',
          id: '5'
      }
  ];
  browseMenuArray = [
      {
          label : 'Collection',
          id: '103'
      },
      {
          label : 'Classification',
          id: '250'
      },
      {
          label : 'Geography',
          id: '260'
      },
      {
          label : 'Teaching Resources',
          id: '270'
      }
  ];

  selectedColMenuId = '1';
  selectedBrowseId = '250';
  currentBrowseRes = {};


  // TypeScript public modifiers
  constructor(
      private _assets: AssetService,
      private route: ActivatedRoute
  ) {   
  } 

  ngOnInit() {
    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => { 
        console.log(params);
      })
    );

    this.loadCategory();
  }

  selectColMenu( id ){
      this.selectedColMenuId = id;
  }
  selectBrowseOpt ( id ){
      this.selectedBrowseId = id;
      this.loadCategory();
  }

  loadCategory(){
    // this.searchLoading = true;
    this._assets.category( this.selectedBrowseId )
      .then((res) => {
        console.log(res);
        this.currentBrowseRes = res;
      })
      .catch(function(err) {
       console.log('Unable to load category results.');
      });
  }

}