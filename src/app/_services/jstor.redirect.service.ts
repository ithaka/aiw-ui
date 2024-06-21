import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChild } from "@angular/router";

const FLAGS_QUERY = `
  query AiwFlagList($flagsFlagList: [String]) {
    flags(flagList: $flagsFlagList) {
      enabled
    }
  }
`;

const REDIRECT_FLAG = "artstor_client_redirect";

@Injectable()
export class JSTORRedirect implements CanActivateChild {
   canActivateChild(route: ActivatedRouteSnapshot) {

    const options = {
      operationName: 'AiwFlagList',
      query: FLAGS_QUERY,
      variables: {
        flagsFlagList: [REDIRECT_FLAG],
      },
    } as any;

    fetch('/ui/data-fetch/gateway', {
      method: 'POST',
      headers: {
        'authorization': 'aiw-ui',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    }).then(async rawResp => {
      const response = await rawResp.json();
      const data = response.data ? response.data : null;
      const enabledFlags = data ? data.flags.enabled : [];
      const doRedirect = enabledFlags.includes(REDIRECT_FLAG);

      const currentRequest = window.location.href;

      if (currentRequest.includes('/#/')) {
        const params = new URLSearchParams({artstorPath: currentRequest }).toString();
        
        fetch(`/get-the-redirect-please/?${params}`).then(async resp => {
          const data = await resp.json();
          if (data.location) {
            if (doRedirect) {
              console.log('Will redirect to:', data.location);
              window.location.replace(data.location);
            } else {
              console.log('Will redirect to:', data.location);
            }
          }

        });
      }
    })

    // Allow Angular to continue routing
    return true;
  }
}
