import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { AssetService } from './../shared/assets.service';
import { AuthService } from './../shared/auth.service';
import { TagsService } from './tags.service';
import { Tag } from './tag/tag.class';

@Component({
  selector: 'ang-my-collections',
  providers: [
      AuthService
  ],
  templateUrl: 'my-collections.component.html',
  styleUrls: [ './browse-page.component.scss' ]
})
export class MyCollectionsComponent implements OnInit {
  constructor(
    private _auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private _assets: AssetService
  ) { }

  private subscriptions: Subscription[] = [];

  private userPCallowed: string;
  private categories = [];
  private tags : Tag[] = [];
  private expandedCategories: any = {};
  private selectedBrowseId: string = '';

  // Reference activeTag for description on side
  private activeTag:  Tag;

  ngOnInit() {

    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => { 
        if(params && params['viewId']){
            this.selectedBrowseId = params['viewId'];
            // this.loadCategory();
        }
      })
    );

    this.userPCallowed = this._auth.getUser().userPCAllowed;
    if(this.userPCallowed == '1'){ // If user has personal collections get data for user's personal collections
      this.getUserPCol();
    }
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
  
  getUserPCol(){
    this._assets.pccollection()
      .then((res) => {
          var obj;

          if(res.pcCollection && res.pcCollection.collectionid){
            let colTag = new Tag(res.pcCollection.collectionid, res.pcCollection.collectionname, true, null, { label: "collection", folder: false }, true);
            if(res.pcCollection.blurburl) {
                  colTag.setDescription(res.pcCollection.blurburl);
              }
              if(res.pcCollection.bigimageurl) {
                  colTag.setThumbnail(res.pcCollection.bigimageurl);
              }
            this.tags.push(colTag); 
          }
          if(res.privateCollection && (res.privateCollection.length > 0)){
            for (let colObj of res.privateCollection){
                let privTag = new Tag(colObj.collectionid, colObj.collectionname, true, null, { label: "collection", folder: true });
                // We've decided to show collection descriptions on the Collection page, and not in Browse
                //   if(colObj.blurburl) {
                //       privTag.setDescription(colObj.blurburl);
                //   }
                //   if(colObj.bigimageurl) {
                //       privTag.setThumbnail(colObj.bigimageurl);
                //   }
                this.tags.push(privTag);
            }
          }

        //   this.loadCategory();
      })
      .catch(function(err) {
          console.log('Unable to load User Personal Collections.');
      });
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