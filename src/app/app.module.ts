import { ApplicationRef, ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NavigationEnd, Router, RouteReuseStrategy, RouterModule, UrlSerializer } from '@angular/router';
import { removeNgStyles, createNewHosts, createInputTransfer } from '@angularclass/hmr';
import { Ng2DeviceDetectorModule } from 'ng2-device-detector';
import { DatePipe } from '@angular/common'

/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { ROUTES } from './app.routes';

// UI modules
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
// import { CoolStorageModule } from 'angular2-cool-storage';
import {LockerModule, Locker, LockerConfig} from 'angular2-locker'
import { Angulartics2Module } from 'angulartics2';
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { RlTagInputModule } from 'angular2-tag-autocomplete';
import { Ng2CompleterModule } from 'ng2-completer';

// Directives
import { ClickOutsideDirective } from 'angular2-click-outside/clickOutside.directive.ts';
import { MediumEditorDirective } from 'angular2-medium-editor/medium-editor.directive.ts';

// ng2-idle
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive'; // this includes the core NgIdleModule but includes keepalive providers for easy wireup
import { MomentModule } from 'angular2-moment'; // optional, provides moment-style pipes for date formatting
import {DndModule} from 'ng2-dnd';

// File Uploader
import { FileUploadModule } from "ng2-file-upload";

// App is our top level component
import { App } from './app.component';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppConfig } from './app.service';
import { Nav, Footer, SearchComponent, PaginationComponent, AssetSearchService } from './shared';
import { NavMenu } from './nav-menu';
import { AssetFilters } from './asset-filters';
import { AssetGrid, ThumbnailComponent } from './asset-grid';
import { Home } from './home';
import { SearchPage } from './search-page';
import { CollectionPage } from './collection-page';
import { PCollectionPage } from './pcollection-page';
import { CategoryPage } from './category-page';
import { ImageGroupPPPage } from './image-group-pp-page';
import { AssetPPPage } from './asset-pp-page';
import { ClusterPage } from './cluster-page';
import { BrowsePage, LibraryComponent, BrowseCommonsComponent,
  MyCollectionsComponent, BrowseInstitutionComponent, BrowseGroupsComponent, TagComponent,
  TagsListComponent, TagFiltersService } from './browse-page';
import { AssetPage, AgreeModalComponent } from './asset-page';
import { AssetViewerComponent } from './asset-page/asset-viewer';
import { AccountPage } from './account-page';
import { AssociatedPage } from './associated-page';
import { ImageGroupPage, PptModalComponent } from './image-group-page';
import { Login } from './login';
import { NoContent } from './no-content';
import { RegisterComponent } from './register/register.component';
import {
  LoginReqModal,
  SearchModal,
  NewIgModal,
  ShareLinkModal,
  DownloadLimitModal,
  UploadImagesModal,
  EditPersonalCollectionModal,
  AddToGroupModal,
  DeleteIgModal,
  NoIgModal,
  AccessDeniedModal,
  PwdResetModal,
  ShareIgLinkModal,
  GenerateCitation,
  ConfirmModal,
  SessionExpireModal,
  RegisterJstorModal
} from './modals';
import { GeneralSearchComponent } from './browse-page/browse-groups/general-search.component'
import { SkyBannerComponent } from './sky-banner/sky-banner.component'


// Application wide providers
import {
  AuthService,
  AssetService,
  GroupService,
  ImageGroupService,
  LogService,
  TitleService,
  ToolboxService,
  TypeIdPipe,
} from './shared'
import { AssetFiltersService } from './asset-filters/asset-filters.service'
import { TagsService } from './browse-page/tags.service'
import { CustomReuseStrategy } from './reuse-strategy'
import { LegacyRouteResolver } from './legacy.service'
import { AnalyticsService } from './analytics.service'
import { HTTP_INTERCEPTORS } from '@angular/common/http'
import { UnauthorizedInterceptor } from './interceptors'

import { LinkifyPipe } from './shared/linkify.pipe'
import { CustomUrlSerializer } from './shared/custom-url-serializer'


const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  DatePipe,
  AnalyticsService,
  AppConfig,
  AssetService,
  AssetSearchService,
  GroupService,
  AuthService,
  LogService,
  ImageGroupService,
  AssetFiltersService,
  TagFiltersService,
  TagsService,
  ToolboxService,
  LegacyRouteResolver,
  Title,
  TitleService,
  { provide: UrlSerializer, useClass: CustomUrlSerializer },
  { provide: HTTP_INTERCEPTORS, useClass: UnauthorizedInterceptor, multi: true }
  // { provide: RouteReuseStrategy, useClass: CustomReuseStrategy } // to be implemented later
];

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [ App ],
  declarations: [
    AccessDeniedModal,
    AccountPage,
    UploadImagesModal,
    EditPersonalCollectionModal,
    AddToGroupModal,
    AgreeModalComponent,
    App,
    AssetFilters,
    AssetGrid,
    AssetPage,
    AssetViewerComponent,
    AssociatedPage,
    BrowseCommonsComponent,
    BrowseGroupsComponent,
    BrowseInstitutionComponent,
    BrowsePage,
    CategoryPage,
    ClickOutsideDirective,
    ClusterPage,
    CollectionPage,
    PCollectionPage,
    ConfirmModal,
    DeleteIgModal,
    SessionExpireModal,
    DownloadLimitModal,
    Footer,
    GeneralSearchComponent,
    Home,
    ImageGroupPage,
    ImageGroupPPPage,
    AssetPPPage,
    LibraryComponent,
    Login,
    LoginReqModal,
    MyCollectionsComponent,
    Nav,
    NavMenu,
    NewIgModal,
    NoContent,
    NoIgModal,
    PaginationComponent,
    PptModalComponent,
    PwdResetModal,
    RegisterComponent,
    RegisterJstorModal,
    SearchComponent,
    SearchModal,
    SearchPage,
    ShareIgLinkModal,
    GenerateCitation,
    ShareLinkModal,
    SkyBannerComponent,
    TagComponent,
    TagsListComponent,
    ThumbnailComponent,
    TypeIdPipe,
    LinkifyPipe,
    MediumEditorDirective
  ],
  imports: [ // import Angular's modules
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RlTagInputModule,
    Ng2CompleterModule,
    LockerModule,
    FileUploadModule,
    RouterModule.forRoot(ROUTES, { useHash: true }),
    Ng2DeviceDetectorModule.forRoot(),
    Angulartics2Module.forRoot([ Angulartics2GoogleAnalytics ]),
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
      }
    }),
    NgbModule.forRoot(), // Ng Bootstrap Import
    NgIdleKeepaliveModule.forRoot(),
    DndModule.forRoot() // Drag n Drop import
  ],
  providers: [ // expose our Services and Providers into Angular's dependency injection
    ENV_PROVIDERS,
    APP_PROVIDERS
  ]
})
export class AppModule {
  constructor(public appRef: ApplicationRef, private router: Router, private _satellite: AnalyticsService) {

    // Track page changes with Adobe Analytics
    router.events.subscribe((val: NavigationEnd) => {
      // If this is a different page, report it!
      if (val.urlAfterRedirects != val.url) {
        _satellite.directCall('page_name')
      }
    })
  }
}

