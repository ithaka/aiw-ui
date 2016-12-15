import { Component, OnInit, OnDestroy } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';
import 'rxjs/add/operator/toPromise';

import { AuthService } from './../shared/auth.service';


@Component({
  selector: 'ang-associated-page', 
  providers: [],
  styles: [ '' ],
  templateUrl: './associated-page.component.html'
})

export class AssociatedPage implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private objectId: string;
  private assetTitle: string;

  constructor(private _router: Router, private route: ActivatedRoute, private http: Http, private _auth: AuthService) {
  }

  ngOnInit() {
    let header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
    let options = new RequestOptions({ headers: header, withCredentials: true }); // Create a request option

    this.subscriptions.push(
      this.route.params.subscribe((matrixParams) => {
        this.objectId = matrixParams["objectId"];
        if (this.objectId) {
          this.http
            .get([this._auth.getUrl(), "metadata", this.objectId].join("/"), options)
            .toPromise()
            .then((data) => { return this._auth.extractData(data); })
            .then((data) => {
              if (!data) {
                throw new Error("No data in image group description response");
              }
              this.assetTitle = data.title;
            })
            .catch((error) => { console.error(error); });
        }
        
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }
}