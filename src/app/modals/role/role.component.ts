import { Router } from '@angular/router'
import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core'

// Project Dependencies
import { IacService } from '_services'

@Component({
  selector: 'ang-role-modal',
  templateUrl: 'role.component.pug'
})
export class RoleModal implements OnInit {
  @Output()
  closeModal: EventEmitter<number> = new EventEmitter();

  constructor(
    private _iac: IacService,
  ) { }

  ngOnInit() {}

  //no matter what we will modify account, either with role prompt time, or with role and role prompt time
}
