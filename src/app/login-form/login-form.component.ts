import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ang-login-form',
  templateUrl: 'login-form.component.pug'
})

export class LoginFormComponent implements OnInit {

  private copyBase: string = ''

  // Set our default values
  public user = new User('','')
  public errorMsg: string = ''
  public instErrorMsg: string = ''
  public showPwdModal = false
  public showHelpModal = false
  public pwdReset = false
  public expirePwd = false
  public pwdRstEmail = ''
  public errorMsgPwdRst = ''
  public forcePwdRst = false
  public successMsgPwdRst = ''
  public loginInstitutions = [] /** Stores the institutions returned by the server */
  public showRegister: boolean = false

  private loginInstName: string = '' /** Bound to the autocomplete field */
  private stashedRoute: string
  private loginLoading = false
  private dataService: LocalData
  private featureFlag: string

  /** 
   * Observable for autocomplete list of institutions
   * - We apply additional sorting 
   */
  private instListSubject: BehaviorSubject<any[]> = new BehaviorSubject([])
  private instListObs: Observable<any[]> = this.instListSubject.asObservable()


  // TypeScript public modifiers
  constructor(
    private _auth: AuthService,
    private _assets: AssetService,
    private _completer: CompleterService,
    private _sso: SSOService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private angulartics: Angulartics2,
    private _analytics: AnalyticsService,
    private _app: AppConfig,
    private _storage: Locker
  ) {
  }

  ngOnInit() {

    if (this.route.snapshot.queryParams.featureFlag == 'sso-hack') {
      this.featureFlag = 'sso-hack'
    }
    // Check for a stashed route to pass to proxy links
    this.stashedRoute = this._storage.get("stashedRoute")

    if (this._app.config.copyModifier) {
      this.copyBase = this._app.config.copyModifier + "."
    }

    // Provide redirects for initPath detected in index.html from inital load
    if ( initPath && (initPath.indexOf('ViewImages') > -1 || initPath.indexOf('ExternalIV') > -1 ) ) {
      this.router.navigateByUrl(initPath)
        .then( result => {
          // Clear variable to prevent further redirects
          initPath = null
          console.log('Redirect to initial path attempt: ' + result)
        })
    }

    // this handles showing the register link for only ip auth'd users
    this._auth.getIpAuth()
      .take(1)
      .subscribe((res) => {
        if (res.remoteaccess === false && res.user) {
          this.showRegister = true
        }
      }, (err) => {
        console.error(err)
      })

    // The true institutions call. Don't throw an error, since the above call will provide a backup
    this._auth.getInstitutions()
      .then((data) => {
        if (data['items']) {
          this.loginInstitutions = data['items'];
          this.dataService = this._completer.local(this.instListObs, 'name', 'name');          
        }
      })
      .catch((error) => {
        console.error(error);
      });

    this._analytics.setPageValues('login', '')

    if (this.featureFlag == 'sso-hack') {
      console.log('we are hacking sso')
      this._sso.getSSOCredentials()
      .take(1)
      .subscribe((res) => {
        console.log(res)
        if (res.username && res.username.length > 0 && res.password && res.password.length > 0) {
          this.login(new User(res.username, res.password))
        }
      }, (err) => {
        console.error(err)
      })
    }
  } // OnInit



  private sortInstitution(event) : void {
    // sort array by string input
    let term = this.loginInstName
    let termReg = new RegExp(term, 'i')
    
    let filtered = this.loginInstitutions.filter( inst => {
      return inst && inst.name.search(termReg) > -1
    })
    filtered = filtered.sort((a, b) => {
        return a.name.search(termReg) - b.name.search(termReg)
    });
    this.instListSubject.next(filtered)
  }

  loadForUser(data: any) {
    if (data && data.user) {
      data.user.hasOwnProperty("username") && this.angulartics.setUsername.next(data.user.username);
      data.user.hasOwnProperty("institutionId") && this.angulartics.setUserProperties.next({ institutionId: data.user.institutionId });
      data.user.hasOwnProperty("isLoggedIn") && this.angulartics.setUserProperties.next({ isLoggedIn: data.user.isLoggedIn });
      data.user.hasOwnProperty("shibbolethUser") && this.angulartics.setUserProperties.next({ shibbolethUser: data.user.shibbolethUser });
      data.user.hasOwnProperty("dept") && this.angulartics.setUserProperties.next({ dept: data.user.dept });
      data.user.hasOwnProperty("ssEnabled") && this.angulartics.setUserProperties.next({ ssEnabled: data.user.ssEnabled })

      if (data.isRememberMe || data.remoteaccess) {
        data.user.isLoggedIn = true
      }
      this._auth.saveUser(data.user);
      this.errorMsg = '';

      // Save user personal collections count in local storage
      this._assets.pccollection()
      .then((res) => {
        let pcEnabled: boolean = false;
        if( (res['privateCollection'] && (res['privateCollection'].length > 0)) || (res['pcCollection'] && res['pcCollection'].collectionid) ){
          pcEnabled = true;
        }
        this._auth.setpcEnabled(pcEnabled);

      })
      .catch(function(err) {
          console.error('Unable to load user PC');
      });
      
      if (this._auth.getFromStorage("stashedRoute")) {
        // We do not want to navigate to the page we are already on
        if (this._auth.getFromStorage("stashedRoute").indexOf('login') > -1) {
          this.router.navigate(['/home']);
        } else {
          this.router.navigateByUrl(this._auth.getFromStorage("stashedRoute"));
        }
        this._auth.deleteFromStorage("stashedRoute");
      } else {
        this.router.navigate(['/home']);
      }

    }
  }

  getLoginError(user) {
    this._auth.getLoginError(user)
      .then((data) => {
        if(data['message'] === 'loginExpired'){
          this.expirePwd = true;
          this.showPwdModal = true;
        }
        else if(data['message'] === 'loginFailed'){
          this.errorMsg = 'LOGIN.WRONG_PASSWORD';
        } else {
          //handles any server errors
          this.errorMsg = "LOGIN.SERVER_ERROR";
        }
      })
      .catch((error) => {
        this.errorMsg = this.getLoginErrorMsg(error.message);
      });
  }

  login(user: User) {
    user.username = user.username.toLowerCase().trim()
    this.loginLoading = true;
    // Clear error messaging
    this.errorMsg = ''
    this.forcePwdRst = false

    if(!this.validateEmail(user.username)){
      this.errorMsg = 'LOGIN.INVALID_EMAIL';
      this.loginLoading = false;
      return;
    }

    if(!this.validatePwd(user.password)){
      this.errorMsg = 'LOGIN.PASSWORD_REQUIRED';
      this.loginLoading = false;
      return;
    }

    this.angulartics.eventTrack.next({ action:"remoteLogin", properties: { category: "login", label: "attempt" }});

    this._auth.login(user)
      .then(
        (data)  => {
          this.loginLoading = false;
          if (data.status === false) {
            if(data.message === 'loginFailed' || data.message === 'Invalid credentials'){
              // Check if old bad-case password
              this.isBadCasePassword(user)
            }
            this.errorMsg = this.getLoginErrorMsg(data.message)
          } else if (!data.isRememberMe && !data.remoteaccess) {
            // In some situations the service might return an ip auth object even tho login was unsuccessful
            this.errorMsg = 'There was an issue with your account, please contact support.';
          } else {
            this.angulartics.eventTrack.next({ action:"remoteLogin", properties: { category: "login", label: "success" }});
            this.featureFlag == 'sso-hack' && this.recordSSOLogin(user.username, user.password)
            this.loadForUser(data);
            this._auth.resetIdleWatcher() // Start Idle on login
          }

        }
      ).catch((err) => {
        this.loginLoading = false;
        let errObj = err.error
        this.errorMsg = this.getLoginErrorMsg(errObj.message)
        if (!this.getLoginErrorMsg(errObj.message)){
          this.getLoginError(user)
          this.angulartics.eventTrack.next({ action:"remoteLogin", properties: { category: "login", label: "failed" }});
        }
        // Check if old bad-case password
        this.isBadCasePassword(user)
      });
  }

  recordSSOLogin(username: string, password: string): void {
    this._sso.postSSOCredentials(username, password)
    .take(1)
    .subscribe((res) => {
      console.log('we done it!', res)
    }, (err) => {
      console.error(err)
    })
  }

  getLoginErrorMsg(serverMsg: string) : string {
    if (serverMsg) {
       if(serverMsg === 'loginFailed' || serverMsg === 'Invalid credentials'){
        return 'LOGIN.WRONG_PASSWORD'
      } else if (serverMsg === 'loginExpired' || serverMsg === 'Login Expired') {
        return 'LOGIN.EXPIRED'
      } else if (serverMsg === 'portalLoginFailed') {
        return 'LOGIN.INCORRECT_PORTAL'
      } else if (serverMsg.indexOf('disabled') > -1) {
        return 'LOGIN.ARCHIVED_ERROR';
      } else {
        return 'LOGIN.SERVER_ERROR'
      }
    } else {
      return 'LOGIN.SERVER_ERROR'
    }
  }

  /** **THIS CAN LIKELY BE REMOVED AFTER RELEVANT USERS' PASSWORDS HAVE BEEN CHANGED**
   * Tests if user's password is an old all lowercase password
   * @param user User must have username (which is an email address) and password to be passed in the request
   */
  isBadCasePassword(user) {
    // Do not test if the user isn't using upparcase characters
    if(user.password == user.password.toLowerCase()) {
      return;
    }
    // Try password all lowercase
    user.password = user.password.toLowerCase()
    this._auth.login(user).then((data) => {
      if (data.status === true) {
        this.forcePwdRst = true
        this.errorMsg = ''
      }
    }, (error) => {
      console.error(error)
    })
  }

  validateEmail(email: string){
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  validatePwd(pwd){
    if((pwd.length >= 7) && (pwd.length <= 20) ){
      return true;
    }
    else{
      return false;
    }
  }

  /**
   * Fired when the user logs in through their institution
   */
  goToInstLogin(): void {
    let len: number = this.loginInstitutions.length
    let selectedInst: any
    let url: string
    // search through the institutions store locally and see if the name the user selected matches one
    for (let i = 0; i < len; i++) {
      if (this.loginInstitutions[i].name == this.loginInstName) {
        selectedInst = this.loginInstitutions[i]
        break
      }
    }
    url = selectedInst.entityID ? selectedInst.entityID : '';

    // if the user selected some institution that doesn't exist, kick them out!!
    if (!selectedInst) {
      this.instErrorMsg = "LOGIN.INSTITUTION_LOGIN.ERRORS.SELECT_INSTITUTION";
      return;
    }

    if (selectedInst.type === 'proxy') {
      // Hashes within a parameter are interpretted incorrectly, and we don't need 'em
      let stashedRoute = this.stashedRoute ? this.stashedRoute.replace("#/", "") : "/"
      // WORKAROUND: Auth is still cleaning data to replace www.artstor.org with library.artstor.org
      if (url.match("//www.artstor.org")) {
        url = url.replace("//www.artstor.org", "//library.artstor.org")
      }
      // Handle passing stashed url to proxies
      let urlToken = /!+TARGET_FULL_PATH!+/g;
      let pathToken = /!+TARGET_NO_SERVER!+/g;
      if (url.match(urlToken)) {
        /**
         * EZProxy forwarding
         * Auth provides !!!TARGET_FULL_PATH!!! as a string to replace for forwarding
         */
        url = url.replace(urlToken, document.location.host + stashedRoute )
      } else {
        /**
         * WAM Proxy forwarding
         * Auth provides !!!TARGET_NO_SERVER!!! as a token/string to replace for forwarding
         */
        // pathTokens are appended after a trailing forward slash
        if (stashedRoute[0] === "/") { stashedRoute = stashedRoute.substr(1) }
        url = url.replace(pathToken, stashedRoute )
      }
      // If proxy, simply open url:
      window.open(url);
    } else {
      // Else if Shibboleth, add parameters:
      // eg. for AUSS https://sso.artstor.org/sso/shibssoinit?idpEntityID=https://idp.artstor.org/idp/shibboleth&target=https%3A%2F%2Fsso.artstor.org%2Fsso%2Fshibbolethapplication%3Fo%3D0049a162-7dbe-4fcf-adac-d257e8db95e5
  
      let origin = window.location.origin + '/#/home';
      let ssoSubdomain = this._auth.getSubdomain() == 'library' ? 'sso' : 'sso.' + this._auth.getSubdomain()
      window.open('https://' + ssoSubdomain + '.artstor.org/sso/shibssoinit?idpEntityID=' + encodeURIComponent(url) + '&o=' + encodeURIComponent(origin));
    }
  }

}