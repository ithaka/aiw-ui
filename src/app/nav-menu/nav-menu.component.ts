import { Subscription } from 'rxjs/Rx';
import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// Project Dependencies
import { AssetService, ImageGroupService } from '../shared';

@Component({
  selector: 'nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: [ './nav-menu.component.scss' ],
})
export class NavMenu implements OnInit, OnDestroy {

  /**
   * Action options so far include:
   * {
   *   group: true,
   *   ...
   * }
   */
  @Input()
  private actionOptions: any = {};

  @Input()
  private allowIgUpdate: boolean = false;
  
  private mobileCollapsed: boolean = true;
  private selectedAssets: any[] = [];
  private subscriptions: Subscription[] = [];
  
  private showImageGroupModal: boolean = false;
  private showAddToGroupModal: boolean = false;

  private copyIG: boolean = false;
  private params: any = {};
  
  // TypeScript public modifiers
  constructor(
    private _router: Router,
    private _assets: AssetService,
    private _ig: ImageGroupService,
    private route: ActivatedRoute
  ) {
  }
  
  ngOnInit() {
    this.subscriptions.push(
      this._assets.selection.subscribe( 
        selectedAssets => {
          this.selectedAssets = selectedAssets;
        },
        error => {
          //
        })
    );

    this.subscriptions.push(
      this.route.params.subscribe((params) => {
        this.params = params;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }
  
  private printImageGroupPage(): void {
    if (this.actionOptions.group) {
      let params = this.route.snapshot.params;

      if (params['igId']) {
        this._router.navigate(['/printpreview/' + params['igId']]);
      }
    }
  }

  /**
   * Select All for Edit Mode
   * - Takes all current results from Asset Service, and selects them!
   * - The selection then broadcasts out to the Asset Grid by observable
   */
  private selectAllInAssetGrid(): void {
    this._assets.allResults.take(1).subscribe(
      assets => {
        if (assets.thumbnails) {
          // Make a copy of the Results array
          let assetsOnPage = [];
          for(var i=0;i<assets.thumbnails.length;i++){
              assetsOnPage.push(assets.thumbnails[i]);
          }
          // Set all assets on page as selected
          this._assets.setSelectedAssets(assetsOnPage);
        }
      }
    );
  }

  /**
   * Uses a combination of groups service and asset service to delete the assets selected in the asset grid
   */
  private deleteSelectedAssets(): void {
    let ig = this.route.snapshot.params['igId'];
    console.log(ig);
    console.log(this._assets.getSelectedAssets());
  }
}
