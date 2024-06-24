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
const OPTIONS = {
  operationName: 'AiwFlagList',
  query: FLAGS_QUERY,
  variables: {
    flagsFlagList: [REDIRECT_FLAG],
  },
} as any;

@Injectable()
export class JSTORRedirect implements CanActivateChild {
  canActivateChild(route: ActivatedRouteSnapshot): Promise<boolean> | boolean {
    return this.checkRedirect();
  }

  async checkRedirect(): Promise<boolean> {
    const flagResponse = await fetch('/ui/data-fetch/gateway', {
      method: 'POST',
      headers: {
        'authorization': 'aiw-ui',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(OPTIONS)
    });
    const flagData = await flagResponse.json();
    const flagStates = flagData.data ? flagData.data : null;
    const enabledFlags = flagStates ? flagStates.flags.enabled : [];
    const doRedirect = enabledFlags.includes(REDIRECT_FLAG);

    const currentRequest = window.location.href;

    if (currentRequest.includes('/#/')) {
      const params = new URLSearchParams({artstorPath: currentRequest }).toString();

      const redirectResponse = await fetch(`/get-the-redirect-please/?${params}`);
      const redirectData = await redirectResponse.json();
      if (redirectData.location) {
        if (doRedirect) {
          console.log('Redirecting to:', redirectData.location);
          window.location.replace(redirectData.location);
          return false;  // Redirecting, don't show the page
        } else {
          console.log('Will eventually redirect to:', redirectData.location);
          return true;  // Eventually redirecting, but for now show the page
        }
      } else {
        return true;  // No redirect set yet, will need to create
      }
    } else {
      return true;  // Not a client-redirectable URL
    }
  }
}
