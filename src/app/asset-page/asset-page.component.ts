import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
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

    /** controls whether or not to show the agreement modal before download */
    // private downloadAuth: boolean = false;
    /** controls whether or not the agreement modal is visible */
    private showAgreeModal: boolean = false;

    constructor(private _assets: AssetService, private _auth: AuthService, private route: ActivatedRoute) { }

    ngOnInit() {
        this.subscriptions.push(
            this.route.params.subscribe((routeParams) => {
                this.asset = new Asset(routeParams["assetId"], this._assets);
            })
        )
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
    }

    private downloadAuth(): boolean {
        return this._auth.downloadAuthorized();
    }
}