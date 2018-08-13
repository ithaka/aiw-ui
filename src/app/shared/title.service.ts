import { AppConfig } from '../app.service';
/**
 * Wraps the Platform-Browser Title service
 */
import { Title } from '@angular/platform-browser';
import { Injectable } from '@angular/core';

@Injectable()
export class TitleService {

constructor(
    private _platformTitle: Title,
    private _app: AppConfig
    ) { }

    public setTitle(newTitle: string): void {
        this._platformTitle.setTitle(newTitle)
    }

    /**
     * Appends app title to subtitle, and sets it
     */
    public setSubtitle(newSubtitle: string): void {
        this._platformTitle.setTitle(this._app.config.pageTitle + ' | ' + newSubtitle)
    }
}
