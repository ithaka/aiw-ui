import { Injectable } from '@angular/core';

// Reference to imported Adobe script in index.html
declare var _satellite: any;

@Injectable()
export class AnalyticsService {

    constructor() { }
    
    public directCall(eventName: string) {
        _satellite.track && _satellite.track(eventName);
    }
}