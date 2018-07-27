import { Component, OnInit, Input } from '@angular/core'
import { Driver } from './dist/driver.min.js'
import { ScriptService } from '../script.service'
import { TourStep } from './tour.service'

@Component({
    selector: 'ang-guide-tour',
    templateUrl: 'tour.component.pug',
    styleUrls: [ 'tour.component.scss' ]
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
        console.log("!!!", Driver)
    }

    ngOnInit() {
        // this.scriptService.loadScript('tourdriver')
        //     .then( data => {
        //       console.log('!!!!!!',data)
        //     })
        // this.driver.defineSteps(this.steps)
        // this.driver.start()
    }

    ngOnDestroy() {
        // Remove Crazy Egg Script from head on destroy because we're only tracking on asset pages
        this.scriptService.removeScript('tourdriver')
    }

  }// end of class
