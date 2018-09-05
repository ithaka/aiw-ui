import { Subscription } from 'rxjs/Rx'
import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

// Project Dependencies
import { AuthService } from '../shared'
import { FormBuilder, FormGroup } from '@angular/forms'

@Component({
  selector: 'app-account-page',
  templateUrl: './account-page.component.pug',
  styleUrls: ['./account-page.component.scss']
})
export class AccountPage implements OnInit {
  private user: any = {};
  private institutionObj: any = {};
  private subscriptions: Subscription[] = [];

  private showChangePassModal: boolean = false
  private accountUpdateForm: FormGroup

  constructor(
    private _auth: AuthService,
    private _router: Router,
    _fb: FormBuilder
  ) {
    this.user = this._auth.getUser()

    this.accountUpdateForm = _fb.group({
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      departmentRole: null,
      department: null
    })
  }

  ngOnInit() {
    if (!this.user.isLoggedIn) {
      this._router.navigate(['/home'])
    }

    this.subscriptions.push(
      this._auth.getInstitution().subscribe((institutionObj) => {
        this.institutionObj = institutionObj
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe() });
  }

}
