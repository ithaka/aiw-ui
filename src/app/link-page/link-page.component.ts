import { Component, OnInit } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'

@Component({
  selector: 'ang-link-page',
  templateUrl: 'link-page.component.pug'
})

export class LinkPage implements OnInit {

  private shibParams: {
    email: string,
    samlTokenId: string
  }

  constructor(
    private route: ActivatedRoute,
    private _router: Router
  ) { }

  private copyBase: string = 'SHIB_'

  ngOnInit() {
    // nav back to regular login if there is no samlTokenId
    if (!this.route.snapshot.params.samlTokenId) {
      this._router.navigate(['/login'])
    }

    this.shibParams = { samlTokenId: this.route.snapshot.params.samlTokenId, email: this.route.snapshot.params.email }
  }

  navigateToRegister(): void {
    this._router.navigate(['/register', this.shibParams])
  }
}