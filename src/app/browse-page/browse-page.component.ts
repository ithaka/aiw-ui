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

  private selectedColMenuId = '1';
  private selectedBrowseId = '250';
  private currentBrowseRes = {};
  private categories = [];
  private expandedCategories: any = {};


  // TypeScript public modifiers
  constructor(
      private _assets: AssetService,
      private route: ActivatedRoute,
      private router: Router
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

  loadSubcategories(category, index){
      this._assets.subcategories( category.widgetId )
      .then((res) => {
        let depth: number;
        if (!category.depth) {
            category.depth = 0;
        }
        // Make depth one deeper than parent
        depth = category.depth + 1;
        for (let cat of res) {
            // Add parent Id for expand/collapse logic
            cat.parentId = category.widgetId;
            // Add subcategory depth value for styling
            cat.depth = depth;
        }
        let beforeItems = this.categories.slice(0, index + 1);
        let afterItems = this.categories.slice(index + 1);
        // Insert loaded categories below parent category
        this.categories = beforeItems.concat(res).concat(afterItems);
      })
      .catch(function(err) {
       console.log('Unable to load subcategories.');
      });
  }

  toggleTree(category, index){
      if(this.expandedCategories[category.widgetId]){
          this.expandedCategories[category.widgetId] = false;
      }
      else{
          if(typeof this.expandedCategories[category.widgetId] == 'undefined'){
              this.loadSubcategories(category, index);
          }
          this.expandedCategories[category.widgetId] = true;
      }
  }

//   toggleSubTree(subCategory){
//       if(subCategory.expanded){
//           subCategory.expanded = false;
//       }
//       else{
//           if(typeof subCategory.expanded == 'undefined'){
//               subCategory.subcategories = [];
//               this.loadSubcategories(subCategory, index);
//           }
//           subCategory.expanded = true;
//       }
//   }

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
        if (node.hasOwnProperty('grpId')) {
            // Navigate to Collection
            this.router.navigate(['image-group', { 'igId' : node.grpId }]);
        } else {
            // Navigate to Image Group
            this.router.navigate(['collection', { 'colId' : node.widgetId } ]);
        }
      }
  }

}