import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Http, HttpModule } from '@angular/http';
import { RouterModule, RouteReuseStrategy } from '@angular/router';
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
import { Angulartics2Module, Angulartics2GoogleAnalytics } from 'angulartics2';
import { TranslateModule, TranslateStaticLoader, TranslateLoader } from 'ng2-translate';
import { RlTagInputModule } from 'angular2-tag-input';
import { MediumEditorDirective } from 'angular2-medium-editor/medium-editor.directive.ts';

// App is our top level component
import { App } from './app.component';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppState, InternalStateType } from './app.service';
import { Nav, Footer, SearchComponent } from './shared';
import { NavMenu } from './nav-menu';
import { AssetFilters } from './asset-filters';
import { AssetGrid, ThumbnailComponent } from './asset-grid';
import { Home } from './home';
import { SearchPage } from './search-page';
import { CollectionPage } from './collection-page';
import { CategoryPage } from './category-page';
import { ImageGroupPPPage } from './image-group-pp-page';
import { ClusterPage } from './cluster-page';
import { BrowsePage, LibraryComponent, BrowseCommonsComponent,
  MyCollectionsComponent, BrowseInstitutionComponent, BrowseGroupsComponent, TagComponent } from './browse-page';
import { AssetPage, AgreeModalComponent } from './asset-page';
import { AssetViewerComponent } from './asset-page/asset-viewer';
import { AssociatedPage } from './associated-page';
import { ImageGroupPage, PptModalComponent } from './image-group-page';
import { Login } from './login';
import { About } from './about';
import { NoContent } from './no-content';
import { LoginReqModal, SearchModal, NewIgModal } from './modals';

// Application wide providers
import { AuthService, AssetService, TypeIdPipe, ToolboxService, LoggingService } from './shared';
import { AssetFiltersService } from './asset-filters/asset-filters.service';
import { TagsService } from './browse-page/tags.service';
import { CustomReuseStrategy } from './reuse-strategy';

const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  AppState,
  AssetService,
  AuthService,
  AssetFiltersService,
  TagsService,
  ToolboxService,
  LoggingService
  // { provide: RouteReuseStrategy, useClass: CustomReuseStrategy } // to be implemented later
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
    CategoryPage,
    ImageGroupPPPage,
    ClusterPage,
    BrowsePage,
    TagComponent,
    AssetViewerComponent,
    AssetPage,
    AgreeModalComponent,
    LibraryComponent,
    BrowseCommonsComponent,
    MyCollectionsComponent,
    BrowseInstitutionComponent,
    BrowseGroupsComponent,
    AssociatedPage,
    AssetFilters,
    AssetGrid,
    SearchComponent,
    ThumbnailComponent,
    ImageGroupPage,
    PptModalComponent,
    LoginReqModal,
    SearchModal,
    NewIgModal,
    Login,
    Home,
    NoContent,
    TypeIdPipe,
    MediumEditorDirective
  ],
  imports: [ // import Angular's modules
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    RlTagInputModule,
    // CoolStorageModule,
    LockerModule,
    RouterModule.forRoot(ROUTES, { useHash: true }),
    Angulartics2Module.forRoot([ Angulartics2GoogleAnalytics ]),
    TranslateModule.forRoot({
        provide: TranslateLoader,
        useFactory: (http: Http) => new TranslateStaticLoader(http, '/assets/i18n', '.json'),
        deps: [Http]
    }),
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

