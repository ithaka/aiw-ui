import { HttpClient } from '@angular/common/http'
import { Injectable } from '@angular/core'
import { map } from 'rxjs/operators'

import { AuthService } from 'app/shared/auth.service'

@Injectable()
export class LogService {

  constructor(
    private _http: HttpClient,
    private _auth: AuthService
  ) { }

  public log(message: LogMessage): void { // message is only typed as any because we want to log anything that is sent
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
  // I didn't take the time to detail this because we don't use it
}

interface LogMessage {
  eventType: string
  item_id?: string
  referring_requestid?: string
  additional_fields?: any
}
