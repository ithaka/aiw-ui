import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { AssetService, AuthService, ImageGroupDescription, ImageGroupService } from './../shared';

@Component({
  selector: 'ang-image-group-pp-page', 
  styleUrls: [ './image-group-pp-page.component.scss' ],
  templateUrl: './image-group-pp-page.component.html'
})

export class ImageGroupPPPage implements OnInit, OnDestroy {

  private header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
  private options = new RequestOptions({ headers: this.header, withCredentials: true }); // Create a request option

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
    private http: Http
  ) {}

  ngOnInit() {
      this.subscriptions.push(
      this.route.params.subscribe((routeParams) => {
        this.igId = routeParams['igId'];

        if (this.igId) {
            this.loadIgDesc(this.igId);
            this.loadIgAssets();
        }
      })
    );

    this.subscriptions.push(
          this._igService.assets.subscribe((data: any) => {
              if(data.igId){
                  this.igName = data.igName;
                  this.assets = this.assets.concat(data.thumbnails);
                  
                  for(var i = 0; i < this.assets.length; i++){
                      // preserve newlines, etc - use valid JSON
                      let jsonString = this.assets[i].jsonListSt.replace(/\\n/g, "\\n")  
                                           .replace(/\\'/g, "\\'")
                                           .replace(/\\"/g, '\\"')
                                           .replace(/\\&/g, "\\&")
                                           .replace(/\\r/g, "\\r")
                                           .replace(/\\t/g, "\\t")
                                           .replace(/\\b/g, "\\b")
                                           .replace(/\\f/g, "\\f");
                      // remove non-printable and other non-valid JSON chars
                      jsonString = jsonString.replace(/[\u0000-\u0019]+/g,""); 
                      let jsonObj;
                      try {
                          jsonObj = JSON.parse(jsonString);
                      }
                      catch (e) {
                          jsonObj = [];
                      }
                      this.assets[i].metaData = jsonObj;
                  }

                  if(this.assets.length < parseInt(data.count)){
                      console.log('Load assets from next page');
                      this._igService.loadIgAssets(this.igId, this.assets.length + 1);
                  }
            }
         })
    );
  }

  // Load Image Group Descrition
  loadIgDesc(igId: string): void{
      this._igService.getGroupDescription(igId).take(1)
            .subscribe((data: ImageGroupDescription) => { 
                if(data){
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