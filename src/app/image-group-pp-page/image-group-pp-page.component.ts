import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Router, ActivatedRoute, UrlSegment } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

// Internal Dependencies
import { AssetService } from './../shared/assets.service';
import { AuthService } from './../shared/auth.service';
import { ImageGroupService } from './../image-group-page/image-group.service';

@Component({
  selector: 'ang-image-group-pp-page', 
  providers: [ImageGroupService],
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
            this.loadIgAssets(this.igId);
        }
      })
    );
  }

  // Load Image Group Descrition
  loadIgDesc(igId: string): void{
      this._igService.getGroupDescription(igId).take(1)
            .subscribe((desc: string) => { 
                if(desc){
                    this.igDesc = desc; 
                }
            });
  }

  // Load Image Group Assets
  loadIgAssets(igId: string): void{
      this._igService.loadIgAssets(igId).take(1)
            .subscribe((data: any) => { 
                if(data){
                    this.igName = data.igName;
                    this.assets = data.thumbnails;

                    for(var i = 0; i < this.assets.length; i++){
                        this.assets[i].metaData = JSON.parse(this.assets[i].jsonListSt);
                    }

                    console.log(this.assets);
                }
             });
  }

  printGroup(): void{
     var printContents = document.getElementById('printable-cntnr').innerHTML;
     var originalContents = document.body.innerHTML;

     document.body.innerHTML = printContents;

     window.print();

     document.body.innerHTML = originalContents;
  }

  ngOnDestroy() {
  }
}