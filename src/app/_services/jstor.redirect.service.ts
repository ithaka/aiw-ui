import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChild } from "@angular/router";

const FLAGS_QUERY = `
  query AiwFlagList($flagsFlagList: [String]) {
    flags(flagList: $flagsFlagList) {
      enabled
    }
  }
`;

const REDIRECT_FLAG = "artstor_client_redirection";

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

    return fetch('/ui/data-fetch/gateway', {
      method: 'POST',
      headers: {
        'authorization': 'aiw-ui',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(options)
    })
      .then((response) => response.json())
      .then((data) => {
        const flagData = data.data ? data.data : null;
        const enabledFlags = flagData ? flagData.flags.enabled : [];
        const doRedirect = enabledFlags.includes(REDIRECT_FLAG);

        const currentRequest = window.location.href;

        if (currentRequest.includes('/#/')) {
          const params = new URLSearchParams({artstorPath: currentRequest }).toString();

          return fetch(`/get-the-redirect-please/?${params}`)
            .then((response) => response.json())
            .then((data) => {
              if (data.location) {
                if (doRedirect) {
                  console.log('Redirecting to:', data.location);
                  window.location.replace(data.location);
                  return false;
                } else {
                  console.log('Will eventually redirect to:', data.location);
                  return true;
                }
              }
            });
        } else {
          return true;
        }
      });
  }
}
