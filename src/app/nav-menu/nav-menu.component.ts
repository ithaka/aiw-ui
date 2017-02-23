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
}
