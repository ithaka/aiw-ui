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

  private pagination: any = {
    totalPages: 1,
    pageSize: 48,
    currentPage: 1
  };

  private tagFilters = [];
  private appliedTags = [];

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

    this.browseMenuArray.push({
      id: 1,
      label: 'Private'
    });

    this.browseMenuArray.push({
      id: 2,
      label: 'Institutional'
    });
    
    this.browseMenuArray.push({
      id: 3,
      label: 'Artstor Curated'
    });

    this.selectedBrowseId = '3';
    this.loadCategory();
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
    this._groups.getAll(this.pagination.pageSize, this.pagination.currentPage, this.appliedTags)
        .take(1).subscribe(
          (data)  => {
            console.log(data);
            this.tagFilters = data.tags;
            this.foldersObj['3'] = this.createGroupTags(data.groups);
            this.pagination.totalPages = Math.floor(data.total / this.pagination.pageSize) + 1;
            this.loadCategory();
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

  toggleFilterBy(tag: string) {
    if (this.appliedTags.indexOf(tag) > -1) {
      this.appliedTags.splice(this.appliedTags.indexOf(tag));
    } else {
      this.appliedTags.push(tag);
    }
    this.loadIGs();
  }
  
  goToPage(pageNo: number): void {
    this.pagination.currentPage = pageNo;
    this.loadIGs();
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