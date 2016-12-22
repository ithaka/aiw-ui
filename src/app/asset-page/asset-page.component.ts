import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription }   from 'rxjs/Subscription';

import { Asset } from './asset';
import { AssetService } from '../shared/assets.service';

@Component({
    selector: 'ang-asset-page',
    templateUrl: 'asset-page.component.html'
})
export class AssetPage implements OnInit, OnDestroy {

    private asset: Asset = new Asset;
    private subscriptions: Subscription[] = [];
    // http://library.artstor.org/library/secure/metadata/

    constructor(private _assets: AssetService, private route: ActivatedRoute) { }

    ngOnInit() {
        let params: any = this.route.snapshot.params;
        this.asset.id = params.assetId;

        this.subscriptions.push(
            this._assets.getById(this.asset.id)
                .subscribe(asset => {
                    console.log(asset);
                })
        );

        
    }

    ngOnDestroy() {
        this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
    }
}