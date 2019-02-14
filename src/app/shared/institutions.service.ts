import { Injectable } from '@angular/core'
import { Subject, from } from 'rxjs'
import { BehaviorSubject, Observable, Subscription } from 'rxjs'
import { HttpClient, HttpHeaders } from '@angular/common/http'

import { AuthService } from '../shared/auth.service'
import { ArtstorStorageService } from '../../../projects/artstor-storage/src/public_api';

@Injectable()
export class InstitutionsService {

  private allInstitutions = []

  constructor(
    private http: HttpClient,
    private _auth: AuthService,
    private _storage: ArtstorStorageService
  ) {
    let storedInstitutions = this._storage.getSession('allInstitutions')
    this.allInstitutions = storedInstitutions && storedInstitutions !== 'undefined' ? storedInstitutions : []
  }

  // All institutions list is a combined cp[y of ss and donating lists
  public getAllInstitutions(): Observable<any> {
    if (this.allInstitutions.length > 0) {
      return from(this.allInstitutions)
    } else {
      this._storage.setSession('allInstitutions', 'undefined')
      return this.http.get(
        this._auth.getUrl() + '/v1/collections/institutions?_method=allinstitutions',
        { withCredentials: true }
      )
    }
  }

  // Shared Shelf institutions list
  public getSSInstitutions(): Observable<any> {
    return this.http.get(
      this._auth.getUrl() + '/v1/collections/institutions?_method=allssinstitutions',
      { withCredentials: true }
    )
  }

  // Donating - (ADL)
  public getDonatingInstitutions(): Observable<any> {
    // Before we subscribe available filter, make sure we get the list of institution id-name map
    return this.http.get(
      this._auth.getUrl() + '/v1/collections/institutions?_method=alldonatinginstitutions',
      { withCredentials: true }
    )
  }

}
