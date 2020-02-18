import { Component, Input } from '@angular/core';

@Component({
  selector: 'toggle-button',
  templateUrl: './toggle-button.component.pug',
  styleUrls: ['./toggle-button.component.scss']
})
export class ToggleButtonComponent {

  @Input()
  checked: boolean = false;

  constructor() { }

}
