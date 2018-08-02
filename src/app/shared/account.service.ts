import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

@Injectable()
export class AccountService {

  constructor(private _http: HttpClient) { }

  update(user: User): Observable<UpdateUserResponse> {
    const updatableFields: string[] = [
      'firstName',
      'lastName',
      'role',
      'dept',
      'newsletter_pref',
      'survey_pref'
    ]
    let updateBody = {}

    // copy over only the updatable fields
    for(let field of updatableFields) {
      updateBody[field] = user[field]
    }

    return this._http.put<UpdateUserResponse>(
      '/api/v1/users',
      updateBody,
      { withCredentials: true }
    )
  }
}

interface User {
  firstName: string
  lastName: string
  role: string
  dept: string
  newsletter_pref: string
  survey_pref: string
  username: string
}

interface UpdateUserResponse {

}