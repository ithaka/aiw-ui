import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from './../shared/assets.service';
// import { AuthService } from './../shared/auth.service';

@Component({
  selector: 'ang-browse-groups',
  templateUrl: 'groups.component.html',
  styleUrls: [ './browse-page.component.scss' ]
})
export class BrowseGroupsComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private _assets: AssetService
  ) { }

  private subscriptions: Subscription[] = [];

  private userTypeId: any;
  private currentBrowseRes: any = {};
  private categories = [];
  private expandedCategories: any = {};
  private selectedBrowseId: string = '';
  private browseMenuArray: any[] = [];
  private foldersObj: any = {};

  ngOnInit() {

    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => { 
        if(params && params['viewId']){
            this.selectedBrowseId = params['viewId'];
            this.loadCategory();
        }
      })
    );

    this.loadIGs();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  /**
   * Changes menu between ADL, University Collections, Open Collections, etc...
   * @param id Id of desired menu from colMenuArray enum
   */
  selectBrowseOpt ( id: string ){
    this.expandedCategories = {};
    this.selectedBrowseId = id;
    this.addRouteParam('viewId', id);
  }
  
  /**
   * Loads Image Groups data for the current user in the array
   */
  private loadIGs(): void{
    this._assets.getIgs()
        .then(
          (data)  => {
            console.log(data);
            
            var obj = {};
            if(data.PrivateFolders.length > 0){
              obj = {
                id: 1,
                label: 'Private Folders'
              };
              this.foldersObj['1'] = data.PrivateFolders;
              this.browseMenuArray.push(obj);
            }
            if(data.PublicFolders.length > 0){
              obj = {
                id: 2,
                label: 'Institutional Folders'
              };
              this.foldersObj['2'] = data.PublicFolders;
              this.browseMenuArray.push(obj);
            }
            if(data.CrossInstFolders.length > 0){
              obj = {
                id: 3,
                label: 'Global Folders'
              };
              this.foldersObj['3'] = data.CrossInstFolders;
              this.browseMenuArray.push(obj);
            }
            if(data.MyCourseFolders.length > 0){
              obj = {
                id: 4,
                label: 'My Course Folders'
              };
              this.foldersObj['4'] = data.MyCourseFolders;
              this.browseMenuArray.push(obj);
            }

          },
          (error) => {
            console.log(error);
            return false;
          }
        ).catch(function(err) {
          console.log(err);
          return false;
        });
  }

  loadCategory(){
    // this._assets.category( this.selectedBrowseId )
    //   .then((res) => {
    //       this.currentBrowseRes = res;
    //       this.categories = res.Categories;

    //       for (let cat of this.categories) { // Add default depth of 0 to every top level node
    //           cat.depth = 0;
    //       }
    //       console.log(res);
    //   })
    //   .catch(function(err) {
    //       console.log('Unable to load category results.');
    //   });

    this.currentBrowseRes = this.foldersObj[this.selectedBrowseId];
    this.categories = this.foldersObj[this.selectedBrowseId];

    for (let cat of this.categories) { // Add default depth of 0 to every top level node
        cat.depth = 0;
    }

    // console.log(this.categories);
    
    
  }

  loadSubcategories(category, index){
    this._assets.subGroups( category.widgetId.split('_')[1] )
      .then((res) => {
        console.log(res);
        let depth: number;
        
        // Make depth one deeper than parent
        depth = category.depth + 1;
        for (let cat of res) {
            // Add parent Id for expand/collapse logic
            cat.parentId = category.widgetId;
            // Add subcategory depth value for styling
            cat.depth = depth;

            if(category.hasIgDesc){
                cat.parentDesc = true;
            }
        }
        let beforeItems = this.categories.slice(0, index + 1);
        let afterItems = this.categories.slice(index + 1);
        // Insert loaded categories below parent category
        this.categories = beforeItems.concat(res).concat(afterItems);

        console.log(this.categories);
      })
      .catch(function(err) {
        console.log('Unable to load subgroups.');
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
    var descId = '';
    var nodeId = '';
      
    if(node.descriptionId){
        descId = node.descriptionId;
        nodeId = node.widgetId;
    }
    else if(node.parentDescId){
        descId = node.parentDescId;
        nodeId = node.parentId;
    }

    this._assets.nodeDesc( descId, nodeId )
    .then((res) => {
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

  showHideNode(node){
    // A node in the tree will only be hidden if any of its parent nodes, going up the hierarchy, is collapsed.
    var isExpanded = true;
    var parentNode : any = {};
    if(node.parentId){
        parentNode = this.getNodeByWidgetId(node.parentId);
        if(this.expandedCategories[parentNode.widgetId] == false){
            isExpanded = false;
        }
        else{
            isExpanded = this.showHideNode(parentNode);
        }
    }
    return isExpanded;
  }

  getNodeByWidgetId( id ){
      var node = {};
      for( let cat of this.categories){
          if(cat.widgetId == id){
              node = cat;
          }
      }
      return node;
  }

    /**
   * Adds a parameter to the route and navigates to new route
   * @param key Parameter you want added to route (as matrix param)
   * @param value The value of the parameter
   */
  private addRouteParam(key: string, value: any) {
    let currentParamsObj: Params = Object.assign({}, this.route.snapshot.params);
    currentParamsObj[key] = value;

    this.router.navigate([currentParamsObj], { relativeTo: this.route });
  }
}