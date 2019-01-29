import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { DomUtilityService, ScriptStore } from '../shared';

declare var document: any;

@Injectable()
export class ScriptService {

    private scripts: any = {};
    private isBrowser: boolean

    constructor(private _dom: DomUtilityService, @Inject(PLATFORM_ID) private platformId: Object,) {
        // Set platform
        this.isBrowser = isPlatformBrowser(this.platformId)
        // Populate available scripts
        ScriptStore.forEach((script: any) => {
            this.scripts[script.name] = {
                loaded: false,
                src: script.src
            };
        });
    }

    load(...scripts: string[]) {
        let promises: any[] = [];
        scripts.forEach((script) => promises.push(this.loadScript(script)));
        return Promise.all(promises);
    }

    loadScript(name: string) {
        return new Promise((resolve, reject) => {
            if (!this.isBrowser) {
                resolve({script: name, loaded: false, status: 'server_rendered'})
            }
            if (this.scripts[name].loaded) {
                resolve({script: name, loaded: true, status: 'already_loaded'});
            }
            else {
                // load script
                let script = this._dom.create('script')
                script.type = 'text/javascript'
                script.async = 'true'
                script.charset = 'utf-8'
                script.src = this.scripts[name].src
                script.id = name
                if (script.readyState) {  // IE
                    script.onreadystatechange = () => {
                        if (script.readyState === 'loaded' || script.readyState === 'complete') {
                            script.onreadystatechange = null;
                            this.scripts[name].loaded = true;
                            resolve({script: name, loaded: true, status: 'loaded'});
                        }
                    };
                } else {  // Others
                    script.onload = () => {
                        this.scripts[name].loaded = true;
                        resolve({script: name, loaded: true, status: 'loaded'});
                    };
                }
                script.onerror = (error: any) => resolve({script: name, loaded: false, status: 'not_loaded'});
                this._dom.byTagName('head')[0].appendChild(script);
            }
        });
    }

    // Remove a script node from document head
    removeScript(id: string): void{
        let script = this._dom.byId(id);

        if (script) {
            this._dom.bySelector('head').removeChild(script);
        }
    }

}
