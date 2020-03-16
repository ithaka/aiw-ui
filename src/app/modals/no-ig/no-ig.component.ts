import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Location } from "@angular/common";
import { Router } from "@angular/router";

// Project Dependencies
import { GroupService, AuthService } from '_services'
import { Subscription } from "rxjs";
import { map } from "rxjs/operators";

@Component({
  selector: 'ang-no-ig-modal',
  templateUrl: 'no-ig.component.pug',
  providers: [
    GroupService
  ]
})
export class NoIgModal {
  @Input() noAccessIg: boolean;
  @Output() closeModal: EventEmitter<any> = new EventEmitter()

  private subscription: Subscription;
  public isLoggedIn: boolean;

  constructor(
    private auth: AuthService,
    private location: Location,
    private router: Router,
  ) { }

  ngOnInit() {
    this.subscription = this.auth.currentUser.pipe(
      map(userObj => {
          this.isLoggedIn = userObj.isLoggedIn;
        },
        (err) => console.error(err)
      )
    ).subscribe();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  goToLogin() {
    this.auth.store('stashedRoute', this.location.path(false));
    this.router.navigate(['/login']);
  }

}
