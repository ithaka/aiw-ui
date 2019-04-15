import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";


const DEFAULT_DISPLAY_TIME: number = 6000

@Injectable({
    providedIn: 'root',
  })
  export class ToastService {

    /**
     * Message Toasts are sent/updated via Observable
     * - Use sendToast() to display a message toast
     * - Toasts are stacked and displayed in the nav component
     */
    public toastUpdatesSource: BehaviorSubject<Toast[]>
    public toastUpdates: Observable<Toast[]>
    //- Hold timers by the toast id
    private toastTimers: {} = {}
  
    constructor(
        private _http: HttpClient
    ) {
        this.toastUpdatesSource = new BehaviorSubject([])
        this.toastUpdates = this.toastUpdatesSource.asObservable()

        // this.sendToast({
        //     id: 'example',
        //     type: 'success',
        //     requireDismiss: true,
        //     stringHTML: '<p>Another example toast!</p>',
        //     links: [{
        //       routerLink: ['/home'],
        //       label: "Example link"
        //     }]
        // })
    }

    public sendToast(newToast: Toast) {
        let isUpdate
        let toasts = this.toastUpdatesSource.value
        // Attach date for received
        newToast.date = new Date()
    
        // Set timeout
        if (!newToast.requireDismiss) {
          // Cancel existing timer if this is a toast *update*
          this.cancelToastTimer(newToast.id)
          // Begin timer for dismissing toast
          this.toastTimers[newToast.id] = setTimeout(() => {
            this.dismissToast(newToast.id)
          }, DEFAULT_DISPLAY_TIME)
        }
    
        // Check if toast with ID exists
        for (let i = 0; i < toasts.length; i++) {
          if (toasts[i].id === newToast.id) {
            // Replace toast with update
            toasts[i] = newToast
            isUpdate = true
            break
          }
        }
        // Push new toasts to the front of the list
        if (!isUpdate) {
          toasts.unshift(newToast)
        }
        this.toastUpdatesSource.next(toasts)
      }
    
      /**
       * Dismiss Toast Message
       * @param toastId Toast for message to dismiss
       */
      public dismissToast(toastId: string, removeImmediately?: boolean) : void {
        let toasts = this.toastUpdatesSource.value
        // Cancel timer, if exists
        this.cancelToastTimer(toastId)
        // Remove toast
        for (let i = 0; i < toasts.length; i++) {
          if (toasts[i].id === toastId) {
            if (removeImmediately) {
                toasts.splice(i, 1)
            } else {
                toasts[i].dismiss = true
            }
            break
          }
        }
        this.toastUpdatesSource.next(toasts)
      }
    
      /**
       * Cancel Toast timer, if it exists
       * @param toastId Toast of timer to cancel
       */
      public cancelToastTimer(toastId: string): void {
        if (this.toastTimers[toastId]) {
          clearTimeout(this.toastTimers[toastId])
        }
    }

}

export interface Toast {
    id: string
    type: string
    stringHTML: string
    links?: {
        routerLink: string[],
        label: string,
        refresh?: boolean
    }[]
    dismiss?: boolean
    date?: Date
    requireDismiss?: boolean
}