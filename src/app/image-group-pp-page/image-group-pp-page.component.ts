import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { AssetService, AuthService, ImageGroupDescription, ImageGroupService } from './../shared';

@Component({
  selector: 'ang-image-group-pp-page',
  styleUrls: [ './image-group-pp-page.component.scss' ],
  templateUrl: './image-group-pp-page.component.pug'
})

export class ImageGroupPPPage implements OnInit, OnDestroy {

  private header = new HttpHeaders().set('Content-Type', 'application/json'); // ... Set content type to JSON
  private options = { headers: this.header, withCredentials: true }; // Create a request option

  private igId: string;
  private igName: string;
  private igDesc: string;
  private assets: any = [];

  private subscriptions: Subscription[] = [];


  constructor(
    private _assets: AssetService,
    private _auth: AuthService,
    private _igService: ImageGroupService,
    private _router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit() {


    // Subscribe to ID in params
    this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        let id = routeParams['igId'];
        let params = Object.assign({}, routeParams);
        // If a page number isn't set, reset to page 1!
        if (!params['page']){
          params['page'] = 1;
        }
        if (id) {
          this._assets.queryAll(params);
          this.igId = id;
        }
      })
    );

    this.subscriptions.push(
      this._assets.allResults.subscribe((results: any) => {
        console.log(results);
        if (results.id){
            this.igDesc = results.description;

            this._assets.getAllThumbnails(results.items)
              .then( allThumbnails => {
                this.assets = allThumbnails;
              })
              .catch( error => {
                console.error(error);
              });

            // this.assets = this.assets.concat(results.thumbnails);

            // for(var i = 0; i < this.assets.length; i++){
            //     this.assets[i].metaData = this.assets[i].jsonListSt;
            // }

        }
      })
    );

  } // OnInit

  // Load Image Group Descrition
  loadIgDesc(igId: string): void{
      this._igService.getGroupDescription(igId).take(1)
            .subscribe((data: ImageGroupDescription) => {
                if (data){
                    this.igDesc = data.igNotes;
                }
            });
  }

  // Load Image Group Assets
  loadIgAssets(): void{
      this._igService.loadIgAssets(this.igId, this.assets.length + 1);
  }

  ngOnDestroy() {
  }
}
