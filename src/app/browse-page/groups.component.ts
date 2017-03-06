import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { AssetService, GroupService } from './../shared';
import { Tag } from './tag/tag.class';
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
    private _assets: AssetService,
    private _groups: GroupService
  ) { }

  private subscriptions: Subscription[] = [];

  private userTypeId: any;
  private currentBrowseRes: any = {};
  private tags: Tag[] = [];
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

  private createGroupTags(folderArray) {
    let childArr: Tag[] = [];
    let parentTag = null;

    for(let group of folderArray) {
            let groupTag = new Tag(group.id, group.name, true, null, { label: "group", folder: false });
            childArr.push(groupTag);
          }
    return childArr;
  }
  
  /**
   * Loads Image Groups data for the current user in the array
   */
  private loadIGs(): void{
    this._groups.getAll()
        .take(1).subscribe(
          (data)  => {
            console.log(data);
            
            this.foldersObj['3'] = this.createGroupTags(data.groups);

            var obj = {};
            // if(data.PrivateFolders.length > 0){
            //   // Create Menu Link
            //   obj = {
            //     id: 1,
            //     label: 'Private Folders'
            //   };
            //   this.browseMenuArray.push(obj);

            //   // Process Tags
            //   this.foldersObj['1'] = this.createGroupTags(data.PrivateFolders);
            // }
            // if(data.PublicFolders.length > 0){
              // Create Menu Link
              // obj = {
              //   id: 2,
              //   label: 'Institutional Folders'
              // };
              // this.browseMenuArray.push(obj);
              
              // Process Tags
              // this.foldersObj['2'] = this.createGroupTags(data.PublicFolders);
            // }
            // if(data.CrossInstFolders.length > 0){
              // Create Menu Link
              obj = {
                id: 3,
                label: 'Global Folders'
              };
              this.browseMenuArray.push(obj);

            //   // Process Tags
            //   this.foldersObj['3'] = this.createGroupTags(data.CrossInstFolders);
            // }
            // if(data.MyCourseFolders.length > 0){
            //   // Create Menu Link
            //   obj = {
            //     id: 4,
            //     label: 'My Course Folders'
            //   };
            //   this.browseMenuArray.push(obj);

            //   // Process Tags
            //   this.foldersObj['4'] = this.createGroupTags(data.MyCourseFolders);
            // }

            // this.selectedBrowseId = '3';
            // this.loadCategory();

          },
          (error) => {
            console.log(error);
            return false;
          }
        );
  }

  loadCategory(){
    this.currentBrowseRes = this.foldersObj[this.selectedBrowseId];
    this.tags = this.foldersObj[this.selectedBrowseId];
  }

  // showHideNode(node){
  //   // A node in the tree will only be hidden if any of its parent nodes, going up the hierarchy, is collapsed.
  //   var isExpanded = true;
  //   var parentNode : any = {};
  //   if(node.parentId){
  //       parentNode = this.getNodeByWidgetId(node.parentId);
  //       if(this.expandedCategories[parentNode.widgetId] == false){
  //           isExpanded = false;
  //       }
  //       else{
  //           isExpanded = this.showHideNode(parentNode);
  //       }
  //   }
  //   return isExpanded;
  // }

  // getNodeByWidgetId( id ){
  //     var node = {};
  //     for( let cat of this.categories){
  //         if(cat.widgetId == id){
  //             node = cat;
  //         }
  //     }
  //     return node;
  // }

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