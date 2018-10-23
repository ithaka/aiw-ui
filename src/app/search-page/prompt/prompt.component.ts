import { Component, OnInit } from '@angular/core';
import { Angulartics2 } from 'angulartics2';

import { AuthService } from './../../shared';

@Component({
  selector: 'ang-prompt',
  styleUrls: ['./prompt.component.scss'],
  templateUrl: 'prompt.component.pug'
})
export class PromptComponent implements OnInit {

  constructor(
    private _angulartics: Angulartics2,
    private _auth: AuthService
  ) {}

  ngOnInit() {}


  public trackUnaffiliatedInstLogin(): void{
    this._angulartics.eventTrack.next({ action: 'unaffiliatedInstLogin', properties: { category: this._auth.getGACategory() }})
  }

}
