import { Injectable } from '@angular/core'

// @Injectable()
// export class LocalPCService {


// }



export interface TourStep {
    element: string
    popover: {
        title: string
        description: string
    }
}