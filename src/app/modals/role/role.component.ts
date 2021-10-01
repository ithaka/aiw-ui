import { Component, OnInit, Output, EventEmitter } from '@angular/core'
import { map, take } from 'rxjs/operators';
import { AccountService, AuthService, User } from '_services'

@Component({
  selector: 'ang-role-modal',
  templateUrl: 'role.component.pug'
})
export class RoleModal implements OnInit {
  @Output()
  closeModal: EventEmitter<number> = new EventEmitter();

  constructor(
    private _account: AccountService, private _auth: AuthService
  ) { }

  ngOnInit() { }

  public updateUser(updateUser) {
    this._account.update(updateUser).pipe(
      take(1),
      map(res => {
        this._auth.saveUser(updateUser)
      },
        err => {
          console.error(err)
        }
      )).subscribe()
  }

  public dismissModal(): void {
    this.closeModal.emit()

    let updateUser = this._auth.getUser()
    let today = new Date()
    updateUser.promptedForRole = today.toISOString()

    this.updateUser(updateUser)
  }

  public saveRole(role: string): void {
    this.closeModal.emit()

    let updateUser = this._auth.getUser()
    let today = new Date()
    updateUser.promptedForRole = today.toISOString()
    updateUser.departmentRole = role

    this.updateUser(updateUser)
  }
}
