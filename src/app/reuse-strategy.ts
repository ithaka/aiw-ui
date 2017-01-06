//https://www.softwarearchitekt.at/post/2016/12/02/sticky-routes-in-angular-2-3-with-routereusestrategy.aspx

import { ActivatedRouteSnapshot, RouteReuseStrategy, DetachedRouteHandle } from '@angular/router';

export class CustomReuseStrategy implements RouteReuseStrategy {

    handlers: {[key: string]: DetachedRouteHandle} = {};
    // handlers: {[key: string]: any} = {};

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
        // console.debug('CustomReuseStrategy:store', route, handle);
        console.log("storing into: ", this.handlers, "store:", handle);
        // routes are stored by path - the key is the path name, and the handle is stored under it so that you can only ever have one object stored for a single path
        this.handlers[route.routeConfig.path] = handle;
        // console.log(this.handlers);
    }

    
    shouldAttach(route: ActivatedRouteSnapshot): boolean {
        // console.debug('CustomReuseStrategy:shouldAttach', route);
        console.log("attaching: ", route, "return: ", !!route.routeConfig && !!this.handlers[route.routeConfig.path]);

        // this will be true if the route has been navigated to before
        let canAttach: boolean = !!route.routeConfig && !!this.handlers[route.routeConfig.path];
        // this decides whether the route already stored should be rendered in place of the requested route, and is the return value
        // should check whether the route.routeConfig.path === this.handlers[route.routeConfig.path]
        // let letsAttach: boolean = this.handlers[route.routeConfig.path] === 
        // console.log(this.handlers[route.routeConfig.path].route.value);
        return !!route.routeConfig && !!this.handlers[route.routeConfig.path];
        // return false;
    }

    /** Returns stored instance of component at route, if it exists */
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
        // console.debug('CustomReuseStrategy:retrieve', route);
        if (!route.routeConfig) return null;
        console.log("retrieving", "return: ", this.handlers[route.routeConfig.path]);
        /** returns handle when the route.routeConfig.path is already stored */
        return this.handlers[route.routeConfig.path];
    }

    /** When return value is false, the controller triggers this.retrieve */
    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        // console.debug('CustomReuseStrategy:shouldReuseRoute', future, curr);
        console.log("deciding");
        // console.log('deciding', future.routeConfig, curr.routeConfig, "return: ", future.routeConfig === curr.routeConfig);
        return future.routeConfig === curr.routeConfig;
    }

}