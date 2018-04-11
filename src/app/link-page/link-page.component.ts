import { Component, OnInit } from '@angular/core'
import { Router, ActivatedRoute } from '@angular/router'

@Component({
  selector: 'ang-link-page',
  templateUrl: 'link-page.component.pug'
})

export class LinkPage implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private _router: Router
  ) { }

  ngOnInit() {
    // nav back to regular login if there is no samlTokenId
    if (!this.route.snapshot.queryParams.samlTokenId) {
      this._router.navigate(['/login'])
    }
  }
}