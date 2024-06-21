import fetch from 'unfetch';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChild } from "@angular/router";
import { ApolloClient } from "apollo-client";
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

const FLAGS_QUERY = `
  query AiwFlagList($flagsFlagList: [String]) {
    flags(flagList: $flagsFlagList) {
      enabled
    }
  }
`;

const APOLLO = new ApolloClient({
  link: createHttpLink({uri: "/ui/data-fetch/gateway", fetch: fetch, headers: { authorization: "aiw-ui" }}),
  cache: new InMemoryCache(),
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

    APOLLO.query(options).then(response => {
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
    }).catch(error => {
      console.error('Error fetching flags:', error);
    });

    // Allow Angular to continue routing
    return true;
  }
}
