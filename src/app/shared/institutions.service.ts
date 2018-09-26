import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject, Observable, Subscription } from 'rxjs/Rx';
import { Locker } from 'angular2-locker';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/toPromise';

import { AuthService } from '../shared/auth.service';

@Injectable()
export class InstitutionsService {

  constructor(
    private locker: Locker,
    private http: HttpClient,
    private _auth: AuthService
  ) {}

  public getDonatingInstitutions(): Observable<any> {
    return this.http.get(
      this._auth.getUrl() + '/v1/collections/institutions?_method=alldonatinginstitutions',
      { withCredentials: true }
    )
  }

  public getSSInstitutions(): Observable<any> {
    return this.http.get(
      this._auth.getUrl() + '/v1/collections/institutions?_method=allssinstitutions',
      { withCredentials: true }
    )
  }

  public getAllInstitutions(): Observable<any> {
      // Before we subscribe available filter, make sure we get the list of institution id-name map
      return this.http.get(
        this._auth.getUrl() + '/v1/collections/institutions?_method=alldonatinginstitutions',
        { withCredentials: true }
      )
    }

}
