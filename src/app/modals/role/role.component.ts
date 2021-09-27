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

  public dismissModal(): void {
    this.closeModal.emit()
    //set timestamp of prompted
  }

  public saveRole(role: string): void {
    this.closeModal.emit()
    //set timestamp of prompted
    //set users new role
  }
}
