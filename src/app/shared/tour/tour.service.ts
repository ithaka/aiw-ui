import { Injectable } from '@angular/core'

export interface TourStep {
    step: number,
    element: string[]
    popover: {
        title: string
        description: string
    }
}