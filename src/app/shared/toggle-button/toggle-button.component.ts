import { Component, Input } from '@angular/core';

@Component({
  selector: 'toggle-button',
  templateUrl: './toggle-button.component.pug',
  styleUrls: ['./toggle-button.component.scss']
})
export class ToggleButtonComponent {

  @Input()
  private checked: boolean = false;

  constructor() { }

}
