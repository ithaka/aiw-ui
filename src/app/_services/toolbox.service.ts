import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Params } from '@angular/router/src/shared';

declare var ActiveXObject: any
@Injectable()
export class ToolboxService {

    constructor() { }

     /**
     * This nasty bugger finds out whether the objects are _traditionally_ equal to each other, like you might assume someone else would have put this function in vanilla JS already
     * One thing to note is that it uses coercive comparison (==) on properties which both objects have, not strict comparison (===)
     * @param base The base object which you would like to compare another object to
     * @param compare The object to compare to base
     * @returns boolean indicating whether or not the objects have all the same properties and those properties are ==
     */
    public compareObjects(base: any, compare: any): boolean {

        // loop through all properties in base object
        for (let baseProperty in base) {

            // determine if comparrison object has that property, if not: return false
            if (compare.hasOwnProperty(baseProperty)) {
                switch (typeof base[baseProperty]) {
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

        for (let compareProperty in compare) {

            // determine if comparrison object has that property, if not: return false
            if (base.hasOwnProperty(compareProperty)) {
                switch (typeof compare[compareProperty]) {
                    case 'object':
                        if ( typeof base[compareProperty] !== 'object' || !this.compareObjects(compare[compareProperty], base[compareProperty]) ) { return false; } break;
                    case 'function':
                        if ( typeof base[compareProperty] !== 'function' || compare[compareProperty].toString() !== base[compareProperty].toString() ) { return false; } break;
                    default:
                        if ( compare[compareProperty] != base[compareProperty] ) { return false; }
                }
            } else {
                return false;
            }
        }

        // returns true only after false HAS NOT BEEN returned through all loops
        return true;
    }

    /**
     * Allows direct modification of the url's query parameters and creates a navigation event
     * @param params the parameters to add to the url (if duplicate parameters already in url, this will overwrite them)
     * @param reset allows resetting of queryParams to empty object plus whatever params you pass, instead of keeping old params
     */
    public addToParams(params: Params, currentParams: any, reset?: boolean): Params {
        let baseParams: Params
        if (reset) {
            baseParams = {}
        } else {
            baseParams = Object.assign({}, currentParams)
        }
        let newParams: Params = Object.assign(baseParams, params)

        return newParams
    }

    /**
     * Enters fullscreen, if allowed by browser
     * @note Should fire immediately within a user-event binding (click, key)
     */
    public requestFullScreen(): void {
        let el = document.getElementById("artstor-viewer");
        // Supports most browsers and their versions.
        var requestMethod = el.requestFullscreen || el['webkitRequestFullscreen'] || el['mozRequestFullscreen'] || el['msRequestFullscreen'];
        if (requestMethod) { // Native full screen.
            requestMethod.call(el);
        } else if (window['ActiveXObject'] && typeof window['ActiveXObject'] !== "undefined") { // Older IE.
            var wscript = new ActiveXObject("WScript.Shell");
            if (wscript !== null) {
                wscript.SendKeys("{F11}");
            }
        }
        let htmlelement: HTMLElement = <HTMLElement>document.getElementsByClassName('btn--zoomIn')[0];
        htmlelement.focus();
    }

    /**
     * Exits fullscreen, if allowed by browser
     * @note Should fire immediately within a user-event binding (click, key)
     */
    public exitFullScreen(): void {
        // Being permissive to reference possible Document methods
        let document: any = window.document;
        if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}
