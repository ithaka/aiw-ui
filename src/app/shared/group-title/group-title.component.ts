import { Component, Input, OnInit, OnDestroy } from '@angular/core'
import { Subscription } from 'rxjs'
import { ActivatedRoute } from '@angular/router'
import { ImageGroup, FlagService, ImageGroupService } from './../'


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

    constructor(
      private _ig: ImageGroupService,
      private route: ActivatedRoute,
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
  
    } // onInit

    ngOnDestroy() {
      this.subscriptions.forEach((sub) => { sub.unsubscribe() })
    }

}