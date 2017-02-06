import { Component, Output, EventEmitter, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'nav-menu',
  providers: [ 

  ],
  templateUrl: './nav-menu.component.html',
  styleUrls: [ './nav-menu.component.scss' ],
})
export class NavMenu {

  /**
   * Action options so far include:
   * {
   *   group: true,
   *   ...
   * }
   */
  @Input()
  private actionOptions: any = {};

  @Output()
  generateImgUrl = new EventEmitter();
  
  private mobileCollapsed: boolean = true;
  
  // TypeScript public modifiers
  constructor(private _router: Router, private route: ActivatedRoute) {
    
  }
  
  ngOnInit() {
    
  }

  private generateSelectedImgURL(): void{
    this.generateImgUrl.emit();
  }

  private printImageGroupPage(): void {
    if (this.actionOptions.group) {
      let params = this.route.snapshot.params;

      if (params['igId']) {
        this._router.navigate(['/printpreview/' + params['igId']]);
      }
    }
  }
}
