import { gql } from '@apollo/client/core';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChild } from "@angular/router";
import { ApolloClient, InMemoryCache } from "@apollo/client/core";

const FLAGS_QUERY = gql`
  query AiwFlagList($flagsFlagList: [String]) {
    flags(flagList: $flagsFlagList) {
      enabled
    }
  }
`;

const APOLLO = new ApolloClient({
  uri: "/ui/data-fetch/gateway",
  headers: { authorization: "aiw-ui" },
});

const REDIRECT_FLAG = "artstor_client_redirect";

@Injectable()
export class JSTORRedirect implements CanActivateChild {
   canActivateChild(route: ActivatedRouteSnapshot) {

    const options = {
      query: FLAGS_QUERY,
      variables: {
        flagsFlagList: [REDIRECT_FLAG],
      },
    } as any;
    const flags = await APOLLO.query(options);
    const data = flags.response ? flags.response.data : null;
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
    // Allow Angular to continue routing
    return true;
  }
}
