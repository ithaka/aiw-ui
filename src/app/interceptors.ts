// other peoples' code
import { Injectable, Injector } from '@angular/core'
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

// our code
import { AuthService } from 'app/shared'

/**
 * This interceptor is applied to all http requests, and monitors ONLY their response. Its job
 *  is to look for responses that indicate the user is not authorized, and then trigger the
 *  front-end logout
 */
@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {
  /**
   * Have to do this differently than the auto-build AuthService in the constructor
   *  because both our HttpClient and the HttpInterceptor require the injection of HttpInterceptor,
   *  which ends up in a circular dependency
   *  https://github.com/angular/angular/issues/18224
   */
  constructor(
    private _inj: Injector // we'll use the injector to access AuthService's methods without instantiating it
  ) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // this wires the handler to the reqest's response
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          // this is the success handler for the response - we don't want to do anything here for now
        }
      }, (err) => {
        // we only want to handle http response errors
        if (err instanceof HttpErrorResponse) {
          // check if it's the droid we're looking for
          if (err.status === 401) {
            console.log('caught you, you theif')
            // the below works, which means we can reference the auth service, now we just need to trigger a modal...
            this._inj.get(AuthService).refreshUserSession(true)
          }
        }
      }))
  }
}
