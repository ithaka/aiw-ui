import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Location } from "@angular/common";
import { Router } from "@angular/router";

// Project Dependencies
import { GroupService, AuthService } from '_services'

@Component({
  selector: 'ang-no-ig-modal',
  templateUrl: 'no-ig.component.pug',
  providers: [
    GroupService
  ]
})
export class NoIgModal {
  @Input() noAccessIg: boolean;
  @Output()
  closeModal: EventEmitter<any> = new EventEmitter();

  constructor(
    private auth: AuthService,
    private location: Location,
    private router: Router,
  ) { }

  goToLogin() {
    this.auth.store('stashedRoute', this.location.path(false));
    this.router.navigate(['/login']);
  }

}
