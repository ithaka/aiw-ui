import { Component, OnInit, Output, EventEmitter } from '@angular/core'
import { map, take } from 'rxjs/operators';
import { AccountService, AuthService } from '_services'
import { Angulartics2 } from 'angulartics2'


@Component({
  selector: 'ang-role-modal',
  templateUrl: 'role.component.pug'
})
export class RoleModal implements OnInit {
  @Output()
  closeModal: EventEmitter<number> = new EventEmitter();

  constructor(
    private _account: AccountService, private _auth: AuthService, private _angulartics: Angulartics2,
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
    this._angulartics.eventTrack.next({ properties: { event: 'role prompt', category: 'onboarding', label: 'Dismissed/No Thanks' } });
  }

  public saveRole(role: string): void {
    this.closeModal.emit()

    let updateUser = this._auth.getUser()
    let today = new Date()
    updateUser.promptedForRole = today.toISOString()
    updateUser.departmentRole = role

    this.updateUser(updateUser)
    this._angulartics.eventTrack.next({ properties: { event: 'role prompt', category: 'onboarding', label: role } });
  }
}
