import { Router } from '@angular/router'
import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core'

// Project Dependencies
import { DomUtilityService } from '_services'

@Component({
  selector: 'ang-role-modal',
  templateUrl: 'role.component.pug'
})
export class RoleModal implements OnInit {
  @Output()
  closeModal: EventEmitter<number> = new EventEmitter();

  @Input() title: string = 'Complete your Profile';

  @Input()
  description: string = "You're a...";

  // Option variables
  @Input() dismiss: string = 'No thanks';
  @Input() primary: string = 'Test';
  @Input() secondary: string = 'test2';

  @ViewChild("modal", {read: ElementRef}) modalElement: ElementRef;


  constructor(
    private _router: Router,
    private _dom: DomUtilityService,
  ) { }

  ngOnInit() {
    // Set focus to the modal to make the links in the modal first thing to tab for accessibility
    // let htmlelement: HTMLElement = <HTMLElement>this._dom.byId('modal');
    // htmlelement.focus()
    if (this.modalElement && this.modalElement.nativeElement){
      this.modalElement.nativeElement.focus()
    }
  }
}
