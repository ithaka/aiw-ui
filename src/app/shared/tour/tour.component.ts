import { Component, OnInit, Input } from '@angular/core'
import * as Driver from '../../../../node_modules/driver.js/dist/driver.min.js'
import { ScriptService } from '../script.service'
import { TourStep } from './tour.service'

@Component({
    selector: 'ang-guide-tour',
    templateUrl: 'tour.component.pug',
    styleUrls: [ './tour.component.scss' ]
  })
  export class GuideTourComponent implements OnInit {

    @Input() public steps: TourStep[];

    private document = document
    private window = window
    private driver: any

    constructor(
        private scriptService: ScriptService
    ){
        //this.driver = new Driver()
        //console.log("!!!", Driver)
    }

    ngOnInit() {
      //this.scriptService.loadScript('tourdriver')
    }

    ngOnDestroy() {
        // Remove Crazy Egg Script from head on destroy because we're only tracking on asset pages
        //this.scriptService.removeScript('tourdriver')
    }



    private startTour() {
      const driver = new Driver({allowClose: false,closeBtnText: 'Exit tour',nextBtnText: 'NEXT',})

      driver.defineSteps(this.steps)
      driver.start()
    }

  }// end of class
