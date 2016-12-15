import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Router } from '@angular/router';
import 'rxjs/add/operator/toPromise';

import { AuthService } from './../shared/auth.service';

@Injectable()
export class CollectionService {
  private proxyUrl = 'http://rocky-cliffs-9470.herokuapp.com/api?url=';
  private baseUrl =  this.proxyUrl + 'http://library.artstor.org/library/secure';

  private header = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
  private options = new RequestOptions({ headers: this.header, withCredentials: true }); // Create a request option

  constructor(private _router: Router, private http: Http, private _auth: AuthService ){
  }

  /**
   * Get metadata about a collection
   * @param colId The collection ID
   */
  getCollectionInfo(colId) {
      let options = new RequestOptions({ withCredentials: true });

      return this.http
          .get(this._auth.getUrl() + '/collections/' + colId, options)
          .toPromise()
          .then(this._auth.extractData);
  }

}