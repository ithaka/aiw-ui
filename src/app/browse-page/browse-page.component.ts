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
  categories = [];


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
        if(params && params['viewId']){
            this.selectedBrowseId = params['viewId'];
        }
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
        // console.log(res);
        this.currentBrowseRes = res;
        this.categories = res.Categories;
      })
      .catch(function(err) {
       console.log('Unable to load category results.');
      });
  }

  loadSubcategories(category){
      this._assets.subcategories( category.widgetId )
      .then((res) => {
        // console.log(res);
        category.subcategories = res;
      })
      .catch(function(err) {
       console.log('Unable to load subcategories.');
      });
  }

  toggleTree(category){
      if(category.expanded){
          category.expanded = false;
      }
      else{
          if(typeof category.expanded == 'undefined'){
              category.subcategories = [];
              this.loadSubcategories(category);
          }
          category.expanded = true;
      }
  }

  toggleSubTree(subCategory){
      if(subCategory.expanded){
          subCategory.expanded = false;
      }
      else{
          if(typeof subCategory.expanded == 'undefined'){
              subCategory.subcategories = [];
              this.loadSubcategories(subCategory);
          }
          subCategory.expanded = true;
      }
  }

  toggleInfo(node){
      if(node.info_expanded){
          node.info_expanded = false;
      }
      else{
          if(typeof node.info_expanded == 'undefined'){
              this.showNodeDesc(node);
          }
          node.info_expanded = true;
      }
  }

  showNodeDesc(node){
      this._assets.nodeDesc( node.descriptionId, node.widgetId )
      .then((res) => {
        // console.log(res);
        if(res.blurbUrl){
            node.info_desc = res.blurbUrl;
            node.info_img = res.imageUrl;
        }
      })
      .catch(function(err) {
       console.log('Unable to load Description.');
      });
  }

  openAssets(node){
      if(!node.isFolder){
          window.open('/#/collection;colId=' + node.widgetId, '_self');
      }
  }

}