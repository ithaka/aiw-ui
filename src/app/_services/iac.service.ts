import { Injectable } from "@angular/core"
import { HttpClient, HttpHeaders } from "@angular/common/http"
import { Observable } from "rxjs"
import { environment } from "environments/environment"


@Injectable()
export class IacService {
    public iacServiceAccountsUrl: string
    public iacServiceSearchUrl: string

    constructor(private _http: HttpClient) {
        this.iacServiceAccountsUrl = environment.API_URL + '/account'
        this.iacServiceSearchUrl = environment.API_URL + '/search'
    }

//   public shouldPromptForRole(user): boolean {
//         let account = this.searchForAccount(user.username)
//         // this.getAccount(account.id)
//         // check if role is set
//         // if so False
//         // if not check if user has been prompted
//         // if so False
//         // if not true
//   }

    public searchForAccount(username: string): Observable<any> {
        let url = this.iacServiceSearchUrl + '/byUsername?username=' + username
        return this._http.get(url)
    }

    public getAccount(accountId: string): Observable<any> {
        let url = this.iacServiceAccountsUrl + '/' + accountId + '?idType=externalId'
        return this._http.get(url)
    }

    public updateRole(accountId: string, role: string): void {
        let query = {
            "type": "INDIVIDUAL",
            "preferences": {
                "artstorDeptRole": role
            }
        }
        this.modifyAccount(accountId, query)
    }

    public updateLastPromptedForRole(accountId: string): void {
        let query = {
            "type": "INDIVIDUAL",
            "preferences": {
                "promptedForRole": Date.now()
            }
        }
        this.modifyAccount(accountId, query)
    }


    public modifyAccount(accountId: string, query): Observable<any> {
        let url = this.iacServiceAccountsUrl + '/' + accountId + '?idType=externalId'
        return this._http.post(url, query, { withCredentials: true })
    }
}