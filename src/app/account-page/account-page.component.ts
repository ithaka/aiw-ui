import { Component, OnInit } from '@angular/core';

// Project Dependencies
import { AuthService } from '../shared';

@Component({
  selector: 'app-account-page',
  templateUrl: './account-page.component.html',
  styleUrls: ['./account-page.component.scss']
})
export class AccountPage implements OnInit {
  private user: any;

  constructor(private _auth: AuthService) { }

  ngOnInit() {
    this.user = this._auth.getUser();
  }

}