import { Subscription } from 'rxjs/Rx'
import { Component, OnInit } from '@angular/core'
import { Router } from '@angular/router'

// Project Dependencies
import { AuthService } from '../shared'
import { FormBuilder, FormGroup } from '@angular/forms'
import { USER_ROLES, USER_DEPTS, UserRolesAndDepts } from './../register/user-roles'

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
  private updateSubmitted: boolean = false

  // update form select field values
  private userDepts: UserRolesAndDepts[] = []
  private userRoles: UserRolesAndDepts[] = []

  constructor(
    private _auth: AuthService,
    private _router: Router,
    _fb: FormBuilder
  ) {
    this.user = this._auth.getUser()

    this.accountUpdateForm = _fb.group({
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      dept: null,
      role: null
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
    )

    // Issues with unauthorized access to the service, and the fact that the data NEVER changes, led us to hardcode these values:
    this.userDepts = USER_DEPTS
    this.userRoles = USER_ROLES
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => { sub.unsubscribe() });
  }

  submitAccountUpdate(form: FormGroup): void {

  }

}
