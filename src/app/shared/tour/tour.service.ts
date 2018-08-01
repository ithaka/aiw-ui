import { Injectable } from '@angular/core'

export interface TourStep {
    element: string
    popover: {
        title: string
        description: string
    }
}