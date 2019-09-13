import { Component, OnInit } from '@angular/core'
import { Angulartics2 } from 'angulartics2'

// Project Dependencies
import { AuthService } from '_services'
import { Router } from '@angular/router'
import { Location } from '@angular/common'

@Component({
  selector: 'ang-prompt',
  styleUrls: ['./prompt.component.scss'],
  templateUrl: 'prompt.component.pug'
})
export class PromptComponent implements OnInit {

  constructor(
    private _angulartics: Angulartics2,
    private _auth: AuthService,
    private _router: Router,
    private location: Location
  ) {}

  ngOnInit() {}

  navigateAndSaveRoute(route: string): void {
    this._auth.store('stashedRoute', this.location.path(false));
    this._router.navigate([route]);
  }

  public trackUnaffiliatedInstLogin(): void{
    this._angulartics.eventTrack.next({ properties: { event: 'unaffiliatedInstLogin', category: 'login' }})
  }

}
