import { Subscription } from 'rxjs/Rx';
import { Component, Output, EventEmitter, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

// Project Dependencies
import { AssetService } from '../shared/assets.service';

@Component({
  selector: 'nav-menu',
  providers: [ 

  ],
  templateUrl: './nav-menu.component.html',
  styleUrls: [ './nav-menu.component.scss' ],
})
export class NavMenu {

  /**
   * Action options so far include:
   * {
   *   group: true,
   *   ...
   * }
   */
  @Input()
  private actionOptions: any = {};

  @Output()
  generateImgUrl = new EventEmitter();
  
  private mobileCollapsed: boolean = true;
  private selectedAssets: any[] = [];
  private subscriptions: Subscription[] = [];
  
  private showImageGroupModal: boolean = false;
  
  // TypeScript public modifiers
  constructor(private _router: Router, private route: ActivatedRoute, private _assets: AssetService) {
    
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
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

  private generateSelectedImgURL(): void{
    this.generateImgUrl.emit();
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
}
