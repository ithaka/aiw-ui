import { Component, Input, OnInit, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs'
import { ActivatedRoute, Router } from '@angular/router'
import { ImageGroup, FlagService, ImageGroupService, AssetService } from './../'


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

    public exportReframeFlag: boolean = false

    private subscriptions: Subscription[] = []

    private prevRouteTS: string = ''

    constructor(
      private _ig: ImageGroupService,
      private _assets: AssetService,
      private route: ActivatedRoute,
      private _router: Router,
      public _flags: FlagService
    ){ }

    ngOnInit() {
      // Subscribe to Route Params
      this.subscriptions.push(
        // Feature flag subscription
        this._flags.flagUpdates.subscribe((flags) => {
            this.exportReframeFlag = flags.exportReframe ? true : false
        }),
        // Read params
        this.route.params.subscribe((routeParams) => {
          // Find feature flags applied on route
          this._flags.readFlags(routeParams)
        })
      )

      // Subscribe to prevRouteTimeStamp
      this._assets.previousRouteTimeStamp.subscribe( timestamp => {
        this.prevRouteTS = timestamp
      })
  
    } // onInit

    ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe() })
    }

    private presentGroup(): void {
      console.log('presentGroup called', this.ig)
      let id = ''
      if(this.ig.items[0] && this.ig.items[0].id) {
        id = this.ig.items[0].id
      } else {
        id = this.ig.items[0]
      }
      let queryParams = {
        prevRouteTS: this.prevRouteTS,
        groupId: this.ig.id,
        presentMode: true
      }
      this._router.navigate(['/asset', id, queryParams]);
    }

}