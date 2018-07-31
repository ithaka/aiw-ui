import { Component, Input } from '@angular/core'
import * as Driver from '../../../../node_modules/driver.js/dist/driver.min.js'
import { TourStep } from './tour.service'

@Component({
    selector: 'ang-guide-tour',
    templateUrl: 'tour.component.pug'
  })
  export class GuideTourComponent{

    @Input() public steps: TourStep[];

    private startTour() {
      const driver = new Driver({ allowClose: false, closeBtnText: 'Exit tour', nextBtnText: 'NEXT', prevBtnText: 'PREVIOUS', doneBtnText: 'DONE' })

      driver.defineSteps(this.steps)
      driver.start()
    }

  }// end of class
