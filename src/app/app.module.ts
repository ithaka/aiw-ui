import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { removeNgStyles, createNewHosts, createInputTransfer } from '@angularclass/hmr';

/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { ROUTES } from './app.routes';

// UI modules
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
// import { CoolStorageModule } from 'angular2-cool-storage';
import {LockerModule, Locker, LockerConfig} from 'angular2-locker'

// App is our top level component
import { App } from './app.component';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppState, InternalStateType } from './app.service';
import { Nav } from './shared/nav';
import { NavMenu } from './nav-menu';
import { AssetFilters } from './asset-filters';
import { AssetGrid } from './asset-grid';
import { Footer } from './shared/footer';
import { Home } from './home';
import { SearchPage } from './search-page';
import { CollectionPage } from './collection-page';
import { ClusterPage } from './cluster-page';
import { BrowsePage, LibraryComponent, BrowseCommonsComponent,
  MyCollectionsComponent, BrowseInstitutionComponent, BrowseGroupsComponent, TagComponent } from './browse-page';
import { AssociatedPage } from './associated-page';
import { ImageGroupPage } from './image-group-page';
import { Login } from './login';
import { About } from './about';
import { NoContent } from './no-content';
import { XLarge } from './home/x-large';

// Application wide providers
import { AuthService } from './shared/auth.service';
import { AssetService } from './shared/assets.service';
import { AssetFiltersService } from './asset-filters/asset-filters.service';

const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  AppState,
  AssetService,
  AuthService,
  AssetFiltersService
];

type StoreType = {
  state: InternalStateType,
  restoreInputValues: () => void,
  disposeOldHosts: () => void
};

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [ App ],
  declarations: [
    App,
    Nav,
    NavMenu,
    Footer,
    About,
    SearchPage,
    CollectionPage,
    ClusterPage,
    BrowsePage,
    TagComponent,
    LibraryComponent,
    BrowseCommonsComponent,
    MyCollectionsComponent,
    BrowseInstitutionComponent,
    BrowseGroupsComponent,
    AssociatedPage,
    AssetFilters,
    AssetGrid,
    ImageGroupPage,
    Login,
    Home,
    NoContent,
    XLarge
  ],
  imports: [ // import Angular's modules
    BrowserModule,
    FormsModule,
    HttpModule,
    // CoolStorageModule,
    LockerModule,
    RouterModule.forRoot(ROUTES, { useHash: true }),
    NgbModule.forRoot() // Ng Bootstrap Import
  ],
  providers: [ // expose our Services and Providers into Angular's dependency injection
    ENV_PROVIDERS,
    APP_PROVIDERS
  ]
})
export class AppModule {
  constructor(public appRef: ApplicationRef, public appState: AppState) {}

  hmrOnInit(store: StoreType) {
    if (!store || !store.state) return;
    console.log('HMR store', JSON.stringify(store, null, 2));
    // set state
    this.appState._state = store.state;
    // set input values
    if ('restoreInputValues' in store) {
      let restoreInputValues = store.restoreInputValues;
      setTimeout(restoreInputValues);
    }

    this.appRef.tick();
    delete store.state;
    delete store.restoreInputValues;
  }

  hmrOnDestroy(store: StoreType) {
    const cmpLocation = this.appRef.components.map(cmp => cmp.location.nativeElement);
    // save state
    const state = this.appState._state;
    store.state = state;
    // recreate root elements
    store.disposeOldHosts = createNewHosts(cmpLocation);
    // save input values
    store.restoreInputValues  = createInputTransfer();
    // remove styles
    removeNgStyles();
  }

  hmrAfterDestroy(store: StoreType) {
    // display new elements
    store.disposeOldHosts();
    delete store.disposeOldHosts;
  }

}

