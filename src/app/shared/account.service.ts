import { Injectable } from "@angular/core"
import { HttpClient, HttpHeaders } from "@angular/common/http"
import { Observable } from "rxjs"
import { environment } from "environments/environment";

@Injectable()
export class AccountService {
  constructor(private _http: HttpClient) {}

  update(user: User): Observable<UpdateUserResponse> {
    const updatableFields: string[] = [
      "firstName",
      "lastName",
      "departmentRole",
      "department",
      /**
       * the proceeding two fields are used for testing. In order to create a pact that tests
       *  invalid field errors, we allow these two fields to be passed. Their names are not field
       *  names which are likely to occur in production, and since they are put here specifically
       *  to test that errors occur, the risk of invalid updates being sent is further mitigated.
       */
      "cantUpdateThisHa",
      "anotherThingYouCantUpdate"
    ]
    let updateBody = {}

    // copy over only the updatable fields
    for (let field of updatableFields) {
      updateBody[field] = user[field]
    }

    return this._http.put<UpdateUserResponse>(
      environment.API_URL + "/api/secure/user/" + user.baseProfileId,
      updateBody,
      {
        headers: new HttpHeaders({
          "Content-Type": "application/json"
        }),
        withCredentials: true
      }
    )
  }
}

interface User {
  firstName: string
  lastName: string
  role: string
  dept: string
  username: string
  baseProfileId: number
}

interface UpdateUserResponse {}
