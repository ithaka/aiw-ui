import { Subscription } from 'rxjs/Rx';
import { Component, OnInit } from '@angular/core';

// Project Dependencies
import { AuthService } from '../shared';

@Component({
  selector: 'app-account-page',
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.scss']
})
export class AccountPage implements OnInit {
  private user: any = {};
  private institutionObj: any = {};
  private subscriptions: Subscription[] = [];
  private changePassLoading: boolean = false;

  constructor(private _auth: AuthService) { }

  ngOnInit() {
    this.user = this._auth.getUser();
    console.log(this.user);

    this.subscriptions.push(
      this._auth.getInstitution().subscribe((institutionObj) => {
        this.institutionObj = institutionObj;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe(); });
  }

}