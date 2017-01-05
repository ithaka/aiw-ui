import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { Asset } from './asset';
import { AuthService, AssetService } from './../shared';

@Component({
    selector: 'ang-asset-page',
    templateUrl: 'asset-page.component.html',
    styleUrls: [ './asset-page.component.scss' ]
})
export class AssetPage implements OnInit, OnDestroy {

    private asset: Asset;
    private subscriptions: Subscription[] = [];

    /** controls whether or not the agreement modal is visible */
    private showAgreeModal: boolean = false;

    // Boolean set by Asset Viewer output
    private isFullscreen: boolean;

    constructor(private _assets: AssetService, private _auth: AuthService, private router: Router, private route: ActivatedRoute) { }

    ngOnInit() {
        this.subscriptions.push(
            this.route.params.subscribe((routeParams) => {
                this.asset = new Asset(routeParams["assetId"], this.router, this._assets, this._auth);
            })
        )
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
    }

    /**
     * Maintains the isFullscreen variable, as set by child AssetViewers
     */
    updateFullscreenVar(isFullscreen: boolean): void {
        console.log(isFullscreen);
        this.isFullscreen = isFullscreen;
    }

    /**
     * Find out if the user has accepted the agreement during this session
     * @returns boolean which is true if the user has accepted the agreement
     */
    private downloadAuth(): boolean {
        return this._auth.downloadAuthorized();
    }

    /** 
     * Clean up the field label for use as an ID (used in testing)
     */
    private cleanId(label: string): string {
        return label.toLowerCase().replace(/\s/g,'');
    }
}