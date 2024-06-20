import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChild } from "@angular/router";

@Injectable()
export class JSTORRedirect implements CanActivateChild {
   canActivateChild(route: ActivatedRouteSnapshot) {

    const currentRequest = window.location.href;

    if (currentRequest.includes('/#/')) {
      const params = new URLSearchParams({artstorPath: currentRequest }).toString();
      fetch(`/get-the-redirect-please/?${params}`).then(async resp => {
        // TODO: Logic to handle "location" response from server and 301 user to that
        const data = await resp.json();
        if (data.location) {
          console.log('redirecting to:', data.location);
        }

      });
    }
    // Allow Angular to continue routing
    return true;
  }
}