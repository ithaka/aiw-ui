import { Component } from '@angular/core';

@Component({
  selector: 'no-content',
  template: `
    <div class="container">
      <div class="row">
        <div class="col-md-8 offset-md-2 pb-4">
          <img class="img-fluid py-4" src="/assets/img/404.png" />
          <h1>Page Not Found</h1>
          <p>We couldn't find what you were looking for!</p>
        </div>
      </div>
    </div>
  `
})
export class NoContent {

}
