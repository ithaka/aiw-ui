import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { Asset } from './asset';
import { AssetService } from '../shared/assets.service';

@Component({
    selector: 'ang-asset-page',
    templateUrl: 'asset-page.component.html',
    styleUrls: [ './asset-page.component.scss' ]
})
export class AssetPage implements OnInit, OnDestroy {

    private asset: Asset;
    private subscriptions: Subscription[] = [];
    // http://library.artstor.org/library/secure/metadata/

    /** controls whether or not to show the agreement modal before download */
    private downloadAuth: boolean = false;
    /** controls whether or not the agreement modal is visible */
    private showAgreeModal: boolean = false;

    constructor(private _assets: AssetService, private route: ActivatedRoute) { }

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
}