import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http'

@Injectable()
export class LoggingService {

  private loggerUrl: string = "//ang-ui-logger.apps.test.cirrostratus.org/api/v1";

  /** Default Headers for this service */
  // ... Set content type to JSON
  private header = new Headers({ 'Content-Type': 'application/json' }); 
  private defaultOptions = new RequestOptions({ headers: this.header, withCredentials: true });

  constructor(
    private http: Http
  ) { }

  public Warp6 (data: logObj) {

    this.http.post(this.loggerUrl + "/log", data, this.defaultOptions)
      .map((data) => { return data.json() || {}; })
      .take(1)
      .subscribe((res) => {
        // console.log(res);
      });
  }
}

interface logObj {
  eventType: string,
  uri?: string,
  status_code?: string,
  project_id?: string,
  file_type?: string,
  reason?: string
}