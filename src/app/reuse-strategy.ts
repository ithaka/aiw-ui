//https://www.softwarearchitekt.at/post/2016/12/02/sticky-routes-in-angular-2-3-with-routereusestrategy.aspx

import { ActivatedRouteSnapshot, RouteReuseStrategy, DetachedRouteHandle } from '@angular/router';

interface RouteStorageObject {
    snapshot: ActivatedRouteSnapshot;
    handle: DetachedRouteHandle;
}

export class CustomReuseStrategy implements RouteReuseStrategy {

    // storedRoutes: {
    //     [key: string]: {
    //         snapshot: ActivatedRouteSnapshot,
    //         handle: DetachedRouteHandle
    //     }
    // } = {};
    storedRoutes: { [key: string]: RouteStorageObject } = {};
    // storedRoutes: {[key: string]: any} = {};

    /** 
     * Decides when the route should be stored
     * If the route should be stored, I believe the boolean is indicating to a controller whether or not to fire this.store
     */
    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        // console.debug('CustomReuseStrategy:shouldDetach', route);
        console.log("detaching", route, "return: ", true);
        return true;
    }

    /**
     * Handles route storage
     * Should also check to make sure we're not storing too many handles, or handles for the same component
     */
    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        let storedRoute: RouteStorageObject = {
            snapshot: route,
            handle: handle
        };

        // console.debug('CustomReuseStrategy:store', route, handle);
        console.log("storing into: ", this.storedRoutes, "store:", storedRoute);
        // routes are stored by path - the key is the path name, and the handle is stored under it so that you can only ever have one object stored for a single path
        this.storedRoutes[route.routeConfig.path] = storedRoute;
        // console.log(this.storedRoutes);
    }

    
    shouldAttach(route: ActivatedRouteSnapshot): boolean {
        // console.debug('CustomReuseStrategy:shouldAttach', route);
        

        // this will be true if the route has been stored before
        let canAttach: boolean = !!route.routeConfig && !!this.storedRoutes[route.routeConfig.path];

        // at this point we already know that the paths match because the storedResults key is the route.routeConfig.path
        // so, if the query params also match, then we should reuse the component
        if (canAttach) {
            let willAttach: boolean = true;
            console.log("param comparison:");
            console.log(this.compareObjects(route.params, this.storedRoutes[route.routeConfig.path].snapshot.params));
            console.log("query param comparison");
            console.log(this.compareObjects(route.queryParams, this.storedRoutes[route.routeConfig.path].snapshot.queryParams));


            let paramsMatch: boolean = this.compareObjects(route.params, this.storedRoutes[route.routeConfig.path].snapshot.params);
            let queryParamsMatch: boolean = this.compareObjects(route.queryParams, this.storedRoutes[route.routeConfig.path].snapshot.queryParams);


            // console.log("attaching: ", route, "match:", this.storedRoutes[route.routeConfig.path].snapshot, "return: ", this.storedRoutes[route.routeConfig.path].snapshot === route);
            console.log("attaching...", route, "does it match?", this.storedRoutes[route.routeConfig.path].snapshot, "return: ", paramsMatch && queryParamsMatch);
            // let queryParamsEqual = this.storedRoutes[route.routeConfig.path].snapshot.queryParams === route.queryParams;
            // return true only if the ActivatedRouteSnapshot from the stored object and the future object are equal
            // return this.storedRoutes[route.routeConfig.path].snapshot === route;
            return paramsMatch && queryParamsMatch;
        } else {
            return false;
        }

        // this decides whether the route already stored should be rendered in place of the requested route, and is the return value
        // should check whether the route.routeConfig.path === this.storedRoutes[route.routeConfig.path]
        // let letsAttach: boolean = this.storedRoutes[route.routeConfig.path] === 
        // console.log(this.storedRoutes[route.routeConfig.path].route.value);
        // return !!route.routeConfig && !!this.storedRoutes[route.routeConfig.path];
        // return false;
    }

    /** Returns stored instance of component at route, if it exists */
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
        // console.debug('CustomReuseStrategy:retrieve', route);
        // return null if the path does not have a routerConfig OR if there is no stored route for that routerConfig
        if (!route.routeConfig || !this.storedRoutes[route.routeConfig.path]) return null;
        console.log("retrieving", "return: ", this.storedRoutes[route.routeConfig.path]);
        /** returns handle when the route.routeConfig.path is already stored */
        return this.storedRoutes[route.routeConfig.path].handle;
    }

    /** When return value is false, the controller triggers this.retrieve */
    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        // console.debug('CustomReuseStrategy:shouldReuseRoute', future, curr);
        console.log("deciding");
        // console.log('deciding', future.routeConfig, curr.routeConfig, "return: ", future.routeConfig === curr.routeConfig);
        return future.routeConfig === curr.routeConfig;
    }

    private compareObjects(base: any, compare: any): boolean {

        // loop through all properties in base object
        for (let baseProperty in base) {

            // determine if comparrison object has that property, if not: return false
            if (compare.hasOwnProperty(baseProperty)) {
                switch(typeof base[baseProperty]) {
                    // if one is object and other is not: return false
                    // if they are both objects, recursively call this comparison function
                    case 'object':
                        if ( typeof compare[baseProperty] !== 'object' || !this.compareObjects(base[baseProperty], compare[baseProperty]) ) { return false; } break;
                    // if one is function and other is not: return false
                    // if both are functions, compare function.toString() results
                    case 'function':
                        if ( typeof compare[baseProperty] !== 'function' || base[baseProperty].toString() !== compare[baseProperty].toString() ) { return false; } break;
                    // otherwise, see if they are equal using coercive comparison
                    default:
                        if ( base[baseProperty] != compare[baseProperty] ) { return false; }
                }
            } else {
                return false;
            }
        }

        // returns true only after false HAS NOT BEEN returned through all loops
        return true;
    }
}