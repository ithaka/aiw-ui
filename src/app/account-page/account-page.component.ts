import { Subscription } from "rxjs"
import { map, take } from 'rxjs/operators'
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core"
import { Router } from "@angular/router"

// Project Dependencies
import { AuthService, AccountService } from "../_services"
import { FormBuilder, FormGroup } from "@angular/forms"
import {
  USER_ROLES,
  USER_DEPTS,
  UserRolesAndDepts
} from "./../register/user-roles"

@Component({
  selector: "app-account-page",
  templateUrl: "./account-page.component.pug",
  styleUrls: ["./account-page.component.scss"]
})
export class AccountPage implements OnInit {
 public user: any = {}
 public institutionObj: any = {}
 public subscriptions: Subscription[] = []

 public showChangePassModal: boolean = false
 public accountUpdateForm: FormGroup

  // ui display controls
 public updateLoading: boolean = false
 public messages: {
    updateSuccess?: boolean
    updateError?: boolean
  } = {}

  // update form select field values
 public userDepts: UserRolesAndDepts[] = []
 public userRoles: UserRolesAndDepts[] = []

  @ViewChild('changePasswordButton', {read: ElementRef}) changePasswordButton: ElementRef<HTMLElement>;

  constructor(
    private _account: AccountService,
    private _auth: AuthService,
    private _router: Router,
    _fb: FormBuilder
  ) {
    this.user = this._auth.getUser()

    console.log(this.user.dept)
    this.accountUpdateForm = _fb.group({
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      departmentRole: [this.user.role],
      department: [this.user.dept]
    })
  }

  ngOnInit() {
    if (!this.user.isLoggedIn) {
      this._router.navigate(["/home"])
    }

    this.subscriptions.push(
      this._auth.getInstitution().pipe(map(institutionObj => {
        this.institutionObj = institutionObj
      })).subscribe()
    )

    // Issues with unauthorized access to the service, and the fact that the data NEVER changes, led us to hardcode these values:
    this.userDepts = USER_DEPTS
    this.userRoles = USER_ROLES

    this.accountUpdateForm.controls.departmentRole.setValue(this.user.role)
    this.accountUpdateForm.controls.department.setValue(this.user.dept)
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe()
    })
  }

  submitAccountUpdate(form: FormGroup): void {
    this.messages = {}
    if (!form.valid) {
      return
    } // I don't think this would actually get hit, but it's here just in case

    this.updateLoading = true

    // get a copy of the current user value, modify it in memory, send it in the update, and then save it back to local storage
    let updateUser = this._auth.getUser()
    Object.assign(updateUser, form.value)

    this._account.update(updateUser).pipe(
      take(1),
      map(res => {
          this.updateLoading = false
          this._auth.saveUser(updateUser)
          this.messages.updateSuccess = true
        },
        err => {
          this.updateLoading = false
          console.error(err)
          this.messages.updateError = true
        }
      )).subscribe()
  }
}
