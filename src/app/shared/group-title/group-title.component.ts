import { Component, Input, OnInit, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs'
import { ActivatedRoute, Router } from '@angular/router'
import { ImageGroup, FlagService, ImageGroupService, AssetService } from './../'
import { ToolboxService } from '../toolbox.service';

@Component({
    selector: 'ang-group-title',
    templateUrl: 'group-title.component.pug',
    styleUrls: ['./group-title.component.scss']
  })
  export class GroupTitleComponent implements OnInit, OnDestroy {
    @Input()
    public ig: ImageGroup

    public dropDownBtnFocused: boolean = false
    public dropDownBtnHovered: boolean = false
    public dropDownOpen: boolean = false

    public dropDownOptFocused: boolean = false
    public dropDownOptHovered: boolean = false

    public exportGoogleFlag: boolean = false

    private subscriptions: Subscription[] = []

    private prevRouteTS: string = ''

    constructor(
      private _ig: ImageGroupService,
      private _assets: AssetService,
      private route: ActivatedRoute,
      private _router: Router,
      public _flags: FlagService,
      private _toolbox: ToolboxService
    ){ }

    ngOnInit() {
      // Subscribe to Route Params
      this.subscriptions.push(
        // Feature flag subscription
        this._flags.flagUpdates.subscribe((flags) => {
            this.exportGoogleFlag = flags.exportGoogle ? true : false
        }),
        // Read params
        this.route.params.subscribe((routeParams) => {
          // Find feature flags applied on route
          this._flags.readFlags(routeParams)
        })
      )
    } // onInit

    ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe() })
    }

    /**
     * Routes user to fullscreen, presentation mode via Asset Page
     */
    public presentGroup(): void {
      let id = ''
      if(this.ig.items[0] && this.ig.items[0].id) {
        id = this.ig.items[0].id
      } else {
        id = this.ig.items[0]
      }
      let queryParams = {
        prevRouteTS: this._assets.currentPreviousRouteTS ,
        groupId: this.ig.id,
        presentMode: true
      }
      // Enter fullscreen - must fire within click binding (Firefox, Safari)
      this._toolbox.requestFullScreen()
      // Route to viewer
      this._router.navigate(['/asset', id, queryParams]);
    }

    public studyGroup(): void {
      let id = ''
      if(this.ig.items[0] && this.ig.items[0].id) {
        id = this.ig.items[0].id
      } else {
        id = this.ig.items[0]
      }
      let queryParams = {
        prevRouteTS: this._assets.currentPreviousRouteTS ,
        groupId: this.ig.id,
        studyMode: true
      }
      // Enter fullscreen - must fire within click binding (Firefox, Safari)
      this._toolbox.requestFullScreen()
      // Route to viewer
      this._router.navigate(['/asset', id, queryParams]);
    }

}