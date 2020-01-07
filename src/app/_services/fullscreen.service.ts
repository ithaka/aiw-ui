import { Injectable } from "@angular/core"

@Injectable()
export class FullScreenService {
    public isFullscreen: boolean = false

    constructor() {}

    public addFullscreenListener() {
        document.addEventListener("fullscreenchange", () => {
            this.toggleFullscreen();
        }, false);
     
        document.addEventListener("mozfullscreenchange", () => {
            this.toggleFullscreen();
        }, false);
     
        document.addEventListener("webkitfullscreenchange",() => {
            this.toggleFullscreen();
        }, false);
     
        document.addEventListener("msfullscreenchange", () => {
            this.toggleFullscreen();
        }, false);
    }
     
    private toggleFullscreen(): void {
        this.isFullscreen = !this.isFullscreen
    }

}