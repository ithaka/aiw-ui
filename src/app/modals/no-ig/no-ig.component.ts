import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Location } from "@angular/common";
import { Router } from "@angular/router";

// Project Dependencies
import { GroupService, AuthService } from '_services'
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: 'ang-no-ig-modal',
  templateUrl: 'no-ig.component.pug',
  providers: [
    GroupService
  ]
})
export class NoIgModal implements OnInit, OnDestroy {
  @Input() noAccessIg: boolean;
  @Output() closeModal: EventEmitter<any> = new EventEmitter();

  private destroy$ = new Subject();
  public isLoggedIn: boolean;

  constructor(
    private auth: AuthService,
    private location: Location,
    private router: Router,
  ) { }

  ngOnInit() {
    this.auth.currentUser.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      userObj => {
        this.isLoggedIn = userObj.isLoggedIn;
      },
      err => {
        console.error(err);
      });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
  }

  get headingText() {
    if (this.noAccessIg) {
      return this.isLoggedIn ? 'NO_IG.HEADING_NO_ACCESS' : 'NO_IG.HEADING_NOT_LOGGED_IN';
    }

    return 'NO_IG.HEADING_NO_EXISTS';
  }

  get bodyText() {
    if (this.noAccessIg) {
      return this.isLoggedIn ? 'NO_IG.NO_ACCESS' : 'NO_IG.NOT_LOGGED_IN';
    }

    return 'NO_IG.NO_EXISTS';
  }

  goToLogin() {
    this.auth.store('stashedRoute', this.location.path(false));
    this.router.navigate(['/login']);
  }

}
