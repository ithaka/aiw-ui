import { Injectable } from "@angular/core"
import { HttpClient, HttpHeaders } from "@angular/common/http"
import { Observable } from "rxjs"
import { environment } from "environments/environment"

// Project Dependencies
import { AuthService } from "./auth.service"

@Injectable()
export class IacService {
    public iacServiceAccountsUrl: string
    public iacServiceSearchUrl: string

    constructor(private _http: HttpClient, private _auth: AuthService) {
        this.iacServiceAccountsUrl = environment.API_URL + '/account'
        this.iacServiceSearchUrl = environment.API_URL + '/search'
    }

//   public shouldPromptForRole(): Observable<any> {
        //let user = this._auth.getUser()
        //searchForAccount(username)
        //getAccount(accountId)
        //check if role is set
        //if so False
        //if not check if user has been prompted
        //if so False
        //if not true
//   }

//   public searchForAccount(username: string): Observable<any> {
        //search based on username
        ///search/byUsername
//   }

//   public getAccount(accountId: string): Observable<any> {
        ///account/{accountId}
//   }

    public getAccount(accountId: string): Observable<any> {
        let url = this.iacServiceAccountsUrl + '/' + accountId + '?idType=externalId'
        return this._http.get(url)
    }

//   public modifyAccount(accountId: string): Observable<any> {
        ///account/{accountId}
//   }
}