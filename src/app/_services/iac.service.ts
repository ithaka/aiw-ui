import { Injectable } from "@angular/core"
import { HttpClient, HttpHeaders } from "@angular/common/http"
import { Observable } from "rxjs"
import { environment } from "environments/environment"

// Project Dependencies
import { AuthService } from "./auth.service"

@Injectable()
export class IacService {
  constructor(private _http: HttpClient, private _auth: AuthService) {}

//   public searchForAccount(groupId: string): Observable<any> {
//   }

//   public getAccount(groupId: string): Observable<any> {
//   }

//   public modifyAccount(groupId: string): Observable<any> {
//   }

}