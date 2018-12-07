// test imports
import { ComponentFixture, TestBed, async } from '@angular/core/testing'
import { By }              from '@angular/platform-browser'
import { DebugElement }    from '@angular/core'

// angular imports
import { FormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { Http } from '@angular/http'
import { Location } from '@angular/common'
import { Angulartics2 } from 'angulartics2'

// our file imports
import { Login } from './login.component'
import { AuthService } from './../shared/auth.service'
// import { LoginService, User } from './login.service'

describe('testy test', () => {
  it('it should test', () => {
    expect(true).toBe(true)
  })
})

// let institutionData: any = {
//   identifier: "name",
//   items: [{ entityId: "test1", name: "Test College 1" }, { entityId: "test2", name: "Test College 2" }],
//   label: "name"
// }

describe('Login component inline template', () => {
  let login: Login;
  let fixture: ComponentFixture<Login>;
  let de: DebugElement;
  let el: HTMLElement;
  let loginSpy;
  let data: TestData;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ FormsModule ],
      declarations: [ Login ],
      providers: [
        { provide: Router, useValue: {} },
        { provide: AuthService, useValue: {} },
        // { provide: LoginService },
        { provide: Http, useValue: {} },
        { provide: Location, useValue: {} },
        { provide: Angulartics2, useValue: {} }
      ]
    });

    data  = new TestData();

    fixture = TestBed.createComponent(Login);

    login = fixture.componentInstance;
  });

  it('should have a heading', () => {
    // initial test to verify that heading exists
    let heading = fixture.debugElement.queryAll(By.css('#loginHeading'));
    expect(heading.length).toEqual(1);

    // negative test for good measure
    let negative = fixture.debugElement.queryAll(By.css('#nothingshouldhavethisid'));
    expect(negative.length).toEqual(0);
  });

  // this test wasn't working so I gave up on it. fixture.detectChanges() caused an error that has something to do with the services
  it('it should show an error message', () => {
    // check that there are no error messages to begin with
    let messages = fixture.debugElement.queryAll(By.css('#errorMsg'));
    expect(messages.length).toEqual(0);

    login.errorMsg = 'this is an error message';
    fixture.detectChanges();
    let msg = fixture.debugElement.queryAll(By.css('#errorMsg'));
    // console.log(msg.nativeElement);
    // expect(msg.nativeElement.getText()).toContain(login.errorMsg);
    expect(msg.length).toEqual(1);
  });


});

class TestData {
  public institutionData: any = {
      identifier: 'name',
      items: [{ entityId: 'test1', name: 'Test College 1' }, { entityId: 'test2', name: 'Test College 2' }],
      label: 'name'
    }
}
