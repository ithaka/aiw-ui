import { Injectable } from "@angular/core"

@Injectable()
export class FullScreenService {
    public isFullscreen: boolean = false

    constructor() {}

    public addFullscreenListener(func?: Function) {
        document.addEventListener("fullscreenchange", () => {
            func && func();
            this.toggleFullscreen();
        }, false);
     
        document.addEventListener("mozfullscreenchange", () => {
            func && func();
            this.toggleFullscreen();
        }, false);
     
        document.addEventListener("webkitfullscreenchange",() => {
            func && func();
            this.toggleFullscreen();
        }, false);
     
        document.addEventListener("msfullscreenchange", () => {
            func && func();
            this.toggleFullscreen();
        }, false);
     
    }
     
    private toggleFullscreen(): void {
        this.isFullscreen = !this.isFullscreen
    }

}