//https://www.softwarearchitekt.at/post/2016/12/02/sticky-routes-in-angular-2-3-with-routereusestrategy.aspx

/**
 * reuse-strategy.ts
 * by corbfon 1/6/17
 */

import { ActivatedRouteSnapshot, RouteReuseStrategy, DetachedRouteHandle } from '@angular/router';

import { ToolboxService } from './shared';

/** Object which can store both: 
 * An ActivatedRouteSnapshot, which is useful for determining whether or not you should attach a route (see this.shouldAttach)
 * A DetachedRouteHandle, which is offered up by this.retrieve, in the case that you do want to attach the stored route
 */
interface RouteStorageObject {
    snapshot: ActivatedRouteSnapshot;
    handle: DetachedRouteHandle;
}

export class CustomReuseStrategy implements RouteReuseStrategy {

    private toolbox = new ToolboxService();
    /** 
     * Object which will store RouteStorageObjects indexed by keys
     * The keys will all be a path (as in route.routeConfig.path)
     * This allows us to see if we've got a route stored for the requested path
     */
    private storedRoutes: { [key: string]: RouteStorageObject } = {};
    private acceptedRoutes: string[] = ["search/:term"];

    /** 
     * Decides when the route should be stored
     * If the route should be stored, I believe the boolean is indicating to a controller whether or not to fire this.store
     * _When_ it is called though does not particularly matter, just know that this determines whether or not we store the route
     * An idea of what to do here: check the route.routeConfig.path to see if it is a path you would like to store
     * @param route This is, at least as I understand it, the route that the user is currently on, and we would like to know if we want to store it
     * @returns boolean indicating that we want to (true) or do not want to (false) store that route
     */
    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        // check if the route is a route we would like to store
        if (this.acceptedRoutes.indexOf(route.routeConfig.path) > -1) {
            console.log("detaching", route);
            return true;
        } else {
            return false; // will be "search/:resultId" when user navigates to result
        }
    }

    /**
     * Constructs object of type `RouteStorageObject` to store, and then stores it for later attachment
     * @param route This is stored for later comparison to requested routes, see `this.shouldAttach`
     * @param handle Later to be retrieved by this.retrieve, and offered up to whatever controller is using this class
     */
    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        let storedRoute: RouteStorageObject = {
            snapshot: route,
            handle: handle
        };

        console.log( "store:", storedRoute, "into: ", this.storedRoutes );
        // routes are stored by path - the key is the path name, and the handle is stored under it so that you can only ever have one object stored for a single path
        this.storedRoutes[route.routeConfig.path] = storedRoute;
    }

    /**
     * Determines whether or not there is a stored route and, if there is, whether or not it should be rendered in place of requested route
     * @param route The route the user requested
     * @returns boolean indicating whether or not to render the stored route
     */
    shouldAttach(route: ActivatedRouteSnapshot): boolean {

        // this will be true if the route has been stored before
        let canAttach: boolean = !!route.routeConfig && !!this.storedRoutes[route.routeConfig.path];

        // this decides whether the route already stored should be rendered in place of the requested route, and is the return value
        // at this point we already know that the paths match because the storedResults key is the route.routeConfig.path
        // so, if the route.params and route.queryParams also match, then we should reuse the component
        if (canAttach) {
            let willAttach: boolean = true;
            console.log("param comparison:");
            console.log(this.toolbox.compareObjects(route.params, this.storedRoutes[route.routeConfig.path].snapshot.params));
            console.log("query param comparison");
            console.log(this.toolbox.compareObjects(route.queryParams, this.storedRoutes[route.routeConfig.path].snapshot.queryParams));

            let paramsMatch: boolean = this.toolbox.compareObjects(route.params, this.storedRoutes[route.routeConfig.path].snapshot.params);
            let queryParamsMatch: boolean = this.toolbox.compareObjects(route.queryParams, this.storedRoutes[route.routeConfig.path].snapshot.queryParams);

            console.log("deciding to attach...", route, "does it match?", this.storedRoutes[route.routeConfig.path].snapshot, "return: ", paramsMatch && queryParamsMatch);
            return paramsMatch && queryParamsMatch;
        } else {
            return false;
        }
    }

    /** 
     * Finds the locally stored instance of the requested route, if it exists, and returns it
     * @param route New route the user has requested
     * @returns DetachedRouteHandle object which can be used to render the component
     */
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {

        // return null if the path does not have a routerConfig OR if there is no stored route for that routerConfig
        if (!route.routeConfig || !this.storedRoutes[route.routeConfig.path]) return null;
        console.log("retrieving", "return: ", this.storedRoutes[route.routeConfig.path]);

        /** returns handle when the route.routeConfig.path is already stored */
        return this.storedRoutes[route.routeConfig.path].handle;
    }

    /** 
     * Determines whether or not the current route should be reused
     * @param future The route the user is going to, as triggered by the router
     * @param curr The route the user is currently on
     * @returns boolean basically indicating true if the user intends to leave the current route
     */
    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        console.log("deciding to reuse", "future", future.routeConfig, "current", curr.routeConfig, "return: ", future.routeConfig === curr.routeConfig);
        return future.routeConfig === curr.routeConfig;
    }

}