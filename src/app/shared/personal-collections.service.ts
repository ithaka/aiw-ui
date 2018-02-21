import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'

import { AuthService } from '.'

@Injectable()
export class PersonalCollectionService {

  constructor(
    private _auth: AuthService,
    private _http: HttpClient
  ) { }

  // public deletePersonalAsset() {

  // }
}