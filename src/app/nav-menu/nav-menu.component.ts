import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'nav-menu',
  providers: [ 

  ],
  templateUrl: './nav-menu.component.html',
  styleUrls: [ './nav-menu.component.scss' ],
})
export class NavMenu {

  @Output()
  generateImgUrl = new EventEmitter();
  
  // TypeScript public modifiers
  constructor( ) { 
    
  }
  
  ngOnInit() {
    
  }

  private generateSelectedImgURL(): void{
    this.generateImgUrl.emit();
  }
}
