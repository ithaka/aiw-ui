import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
// import { HttpModule } from '@angular/http';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

export class User {
  constructor(
    public username: string,
    public password: string) { }
}
 
var users = [
  new User('qa001@artstor.org','artstor')
];
 
@Injectable()
export class AuthenticationService {
    
    constructor(private _router: Router, private http: Http){}
    // private instance var for base url
    private loginUrl = 'http://library.artstor.org/library/secure/login';
    
    logout() {
        localStorage.removeItem("user");
        this._router.navigate(['Login']);
    }
    
    // We are maintaining strictness by ensuring that the service instance methods always return an observable of type
    login(onNext: (user: Object) => void) {
        let headers = new Headers({ 'Content-Type': 'application/json' }); // ... Set content type to JSON
        let options = new RequestOptions({ headers: headers }); // Create a request option

        this.http.post(this.loginUrl, { }, options)
            // ...and calling .json() on the response to return data
            .map((res:Response) => res.json())
            //...errors if any
            .subscribe(onNext,
                       error => 
                       console.log("An error occurred when requesting login.", error));
    
    // var authenticatedUser = users.find(u => u.username === user.username);
    // if (authenticatedUser && authenticatedUser.password === user.password){
    //     localStorage.setItem("user", authenticatedUser.username);
    // //   this._router.navigate(['Home']);      
    //     return true;
    // }
    // return false;

    }
 
   checkCredentials(){
    if (localStorage.getItem("user") === null){
        this._router.navigate(['Login']);
    }
  } 
}