import { Injectable } from '@angular/core'

export interface TourStep {
    step?: number
    element: string[]
    popover: {
        position?: string,
        title: string,
        description: string
    }
    onNext?: () => void
}
