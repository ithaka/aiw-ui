import { Component } from '@angular/core';

// Project Dependencies
const { version: appVersion } = require('../../../../package.json');

@Component({
  selector: 'footer',
  providers: [
    
  ],
  templateUrl: './footer.component.html',
  styleUrls: [ './footer.component.scss' ],
})
export class Footer {
  private appVersion = '';
  private currentYear;
  
  // TypeScript public modifiers
  constructor( ) { 
    // Get version number
    this.appVersion = appVersion;

    // Set current year
    this.currentYear = new Date().getFullYear();
  }

  
  ngOnInit() {
    
  }
}
