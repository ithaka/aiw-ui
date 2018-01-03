import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { AuthService } from 'app/shared'

@Injectable()
export class LogService {

  constructor(
    private _http: HttpClient,
    private _auth: AuthService
  ) { }

  public log(message: any): void { // message is only typed as any because we want to log anything that is sent
    this._http.post<LogResponse>(
      [this._auth.getUrl(), 'v1', 'log'].join('/'),
      message,
      { withCredentials: true }
    )
    .take(1)
    .subscribe((res) => {
      console.log(res)
    }, (err) => {
      console.error(err)
    })
  }
}

interface LogResponse {

}