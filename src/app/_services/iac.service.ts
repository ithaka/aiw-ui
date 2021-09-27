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

    constructor(private _http: HttpClient) {
        this.iacServiceAccountsUrl = environment.API_URL + '/account'
        this.iacServiceSearchUrl = environment.API_URL + '/search'
    }

//   public shouldPromptForRole(user: User): Observable<any> {
//         this.searchForAccount(user.username)
//         this.getAccount(accountId)
//         check if role is set
//         if so False
//         if not check if user has been prompted
//         if so False
//         if not true
//   }

//   public searchForAccount(username: string): Observable<any> {
        //search based on username
        ///search/byUsername
//   }

    public getAccount(accountId: string): Observable<any> {
        let url = this.iacServiceAccountsUrl + '/' + accountId + '?idType=externalId'
        return this._http.get(url)
    }

    // public updateRole
    // {
    //     "type":"INDIVIDUAL",
    //     "preferences": {
    //       "artstorDeptRole":"artstorDeptRole"
    //     }
    //   }

    // public updateLastPromptedForRole
    // {
    //     "type":"INDIVIDUAL",
    //     "preferences": {
    //       "promptedForRole":"promptedForRole"
    //     }
    //   }

//   public modifyAccount(accountId: string, query): Observable<any> {
        ///account/{accountId}
        
//   }
}