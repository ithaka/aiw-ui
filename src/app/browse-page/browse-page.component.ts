import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';
import { AssetService } from '../shared/assets.service';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'ang-browse-page', 
  providers: [
      AuthService
  ],
  styleUrls: [ './browse-page.component.scss' ],
  templateUrl: './browse-page.component.html'
})

export class BrowsePage implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  colMenuArray = [
      {
          label : 'Artstor Digital Library',
          id: '1',
          link: 'library'
      },
      {
          label : 'Open Collections',
          id: '3',
          link: 'commons'
      },
      {
          label : 'Groups',
          id: '5',
          link: 'groups'
      }
  ];
  
  private userPCallowed: string;
  private userTypeId: any;
  private selectedColMenuId: string = '1';

  // TypeScript public modifiers
  constructor(
      private _auth: AuthService,
      private _assets: AssetService,
      private route: ActivatedRoute,
      private router: Router
  ) {   
  } 

  ngOnInit() {
    this.subscriptions.push(
      this.route.params
      .subscribe((params: Params) => { 

        if(params && params['menuId']) {
            this.selectedColMenuId = params['menuId'];
            console.log("just changed menu id!");
        }

      })
    );

    this.userPCallowed = this._auth.getUser().userPCAllowed;
    if(this.userPCallowed == '1'){
        var obj = {
            label : 'My Collections',
            id: '4',
            link: 'mycollections'
        }
        this.colMenuArray.splice(2, 0 ,obj);
    }

    this.userTypeId = this._auth.getUser().typeId;
    if(this.userTypeId == 2){
        this._assets.getCollections('institution')
        .then(
          (data)  => {
            console.log(data);
            var obj = {
                label : data.institutionName,
                id: '2',
                link: 'institution'
            }
            this.colMenuArray.splice(1, 0 ,obj);
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
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

    /**
     * Changes menu between ADL, University Collections, Open Collections, etc...
     * @param id Id of desired menu from colMenuArray enum
     */
    private selectColMenu( id: string ){
        this.selectedColMenuId = id;
        //   this.addRouteParam('menuId', id);
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