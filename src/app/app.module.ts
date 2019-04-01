import { ApplicationRef, NgModule, Inject, APP_ID, PLATFORM_ID } from '@angular/core';
import { BrowserModule, Title } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { NavigationEnd, Router, RouteReuseStrategy, RouterModule, UrlSerializer, PreloadAllModules } from '@angular/router';
// import { removeNgStyles, createNewHosts, createInputTransfer } from '@angularclass/hmr';
import { DeviceDetectorModule } from 'ngx-device-detector';
import { DatePipe, isPlatformBrowser } from '@angular/common'


/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { ROUTES } from './app.routes';

// UI modules
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Angulartics2Module, Angulartics2Settings } from 'angulartics2'
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { NgxTagInputModule } from 'ngx-tag-autocomplete';
import { Ng2CompleterModule } from 'ng2-completer';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

// Directives
import { ClickOutsideDirective } from './_directives';
import { MediumEditorDirective } from 'angular2-medium-editor';

// ng2-idle
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive'; // this includes the core NgIdleModule but includes keepalive providers for easy wireup
import { SortablejsModule } from 'angular-sortablejs'

// File Uploader
import { FileUploadModule } from 'ng2-file-upload';

// App is our top level component
import { AppComponent } from './app.component'
import { APP_RESOLVER_PROVIDERS } from './app.resolver'
import { AppConfig } from './app.service'
import { Nav, Footer, SearchComponent, PaginationComponent, AssetSearchService, InstitutionsService, DomUtilityService, ToastComponent, GroupTitleComponent } from './shared'
import { GuideTourComponent } from './shared/tour/tour.component'
import { NavMenu } from './nav-menu'
import { AssetFilters } from './asset-filters'
import { AssetGrid, ThumbnailComponent } from './asset-grid'
import { Home, FeaturedComponent } from './home'
import { SearchPage, PromptComponent } from './search-page'
import { CollectionPage } from './collection-page'
import { PCollectionPage } from './pcollection-page'
import { CategoryPage } from './category-page'
import { ImageGroupPPPage } from './image-group-pp-page'
import { AssetPPPage } from './asset-pp-page'
import { ClusterPage } from './cluster-page'
import { BrowsePage, LibraryComponent, AdlCollectionFilterPipe, IgGroupFilterPipe, BrowseCommonsComponent,
  MyCollectionsComponent, BrowseInstitutionComponent, BrowseGroupsComponent, TagComponent, CardViewComponent,
  TagsListComponent, TagFiltersService } from './browse-page'
import { AssetPage, AgreeModalComponent, ArtstorViewerComponent } from './asset-page'
import { AccountPage } from './account-page'
import { AssociatedPage } from './associated-page'
import { ImageGroupPage, PptModalComponent, TermsAndConditionsComponent } from './image-group-page'
import { Login } from './login'
import { NoContent } from './no-content'
import { LinkPage } from './link-page'
import { RegisterComponent } from './register/register.component'
import { LoginFormComponent } from './login-form'
import {
  AccessDeniedModal,
  AddToGroupModal,
  ChangePasswordModal,
  ConfirmModal,
  DeleteIgModal,
  DownloadLimitModal,
  EditPersonalCollectionModal,
  GenerateCitation,
  LoginReqModal,
  NewIgModal,
  NoIgModal,
  PwdResetModal,
  RegisterJstorModal,
  SearchModal,
  ServerErrorModal,
  SessionExpireModal,
  ShareIgLinkModal,
  ShareLinkModal,
  GoogleAuthComponent
} from './modals'
import { CollectionBadgeComponent } from './collection-badge'
import { UploaderComponent } from './uploader/uploader.component'
import { GeneralSearchComponent } from './browse-page/browse-groups/general-search.component'
import { SkyBannerComponent } from './sky-banner/sky-banner.component'


// Application wide providers
import {
  AuthService,
  AssetService,
  FlagService,
  GroupService,
  ImageGroupService,
  LogService,
  TitleService,
  ToolboxService,
  TypeIdPipe,
  ScriptService,
  PersonalCollectionService,
  AccountService
} from './shared'
import { MetadataService, SlidesService } from './_services'

import { LocalPCService } from './_local-pc-asset.service'
import { AssetFiltersService } from './asset-filters/asset-filters.service'
import { TagsService } from './browse-page/tags.service'
import { LegacyRouteResolver } from './legacy.service'
import { GroupsRouteResolver } from './browse-page/groups-redirect.service'
import { HTTP_INTERCEPTORS } from '@angular/common/http'
import { UnauthorizedInterceptor } from './interceptors'

import { LinkifyPipe } from './shared/linkify.pipe'
import { KeysPipe } from './shared/keys.pipe'
import { CustomUrlSerializer } from './shared/custom-url-serializer'
import { LOCAL_STORAGE , WINDOW} from '@ng-toolkit/universal'
import { ArtstorStorageService } from '../../../projects/artstor-storage/src/public_api'

const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  AccountService,
  AppConfig,
  AssetService,
  AssetSearchService,
  AuthService,
  DatePipe,
  FlagService,
  InstitutionsService,
  DomUtilityService,
  GroupService,
  PersonalCollectionService,
  LocalPCService,
  LogService,
  ImageGroupService,
  ScriptService,
  SlidesService,
  AssetFiltersService,
  TagFiltersService,
  TagsService,
  ToolboxService,
  LegacyRouteResolver,
  GroupsRouteResolver,
  Title,
  TitleService,
  MetadataService,
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
  declarations: [
    AccessDeniedModal,
    AccountPage,
    EditPersonalCollectionModal,
    AddToGroupModal,
    AgreeModalComponent,
    AppComponent,
    AssetFilters,
    AssetGrid,
    AssetPage,
    ArtstorViewerComponent,
    AssociatedPage,
    AssetPPPage,
    BrowseCommonsComponent,
    BrowseGroupsComponent,
    BrowseInstitutionComponent,
    BrowsePage,
    CardViewComponent,
    CategoryPage,
    ChangePasswordModal,
    ClickOutsideDirective,
    ClusterPage,
    CollectionBadgeComponent,
    CollectionPage,
    ConfirmModal,
    DeleteIgModal,
    DownloadLimitModal,
    EditPersonalCollectionModal,
    FeaturedComponent,
    Footer,
    GeneralSearchComponent,
    GroupTitleComponent,
    Home,
    ImageGroupPage,
    ImageGroupPPPage,
    KeysPipe,
    LibraryComponent,
    IgGroupFilterPipe,
    AdlCollectionFilterPipe,
    LinkifyPipe,
    LinkPage,
    Login,
    LoginFormComponent,
    LoginReqModal,
    MediumEditorDirective,
    MyCollectionsComponent,
    Nav,
    NavMenu,
    NewIgModal,
    NoContent,
    NoIgModal,
    PaginationComponent,
    GuideTourComponent,
    PCollectionPage,
    PptModalComponent,
    PwdResetModal,
    RegisterComponent,
    RegisterJstorModal,
    SearchComponent,
    SearchModal,
    SearchPage,
    ServerErrorModal,
    SessionExpireModal,
    ShareIgLinkModal,
    GenerateCitation,
    ShareLinkModal,
    GoogleAuthComponent,
    SkyBannerComponent,
    TagComponent,
    TagsListComponent,
    TermsAndConditionsComponent,
    ThumbnailComponent,
    ToastComponent,
    PromptComponent,
    TypeIdPipe,
    UploaderComponent
  ],
  imports: [ // import Angular's modules
    BrowserModule.withServerTransition({ appId: 'avatar' }),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgxTagInputModule,
    Ng2CompleterModule,
    InfiniteScrollModule,
    FileUploadModule,
    RouterModule.forRoot(ROUTES, {
        useHash: true,
        preloadingStrategy: PreloadAllModules,
        initialNavigation: 'enabled'
      }),
    DeviceDetectorModule.forRoot(),
    Angulartics2Module.forRoot(),
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
      }
    }),
    NgbModule.forRoot(), // Ng Bootstrap Import
    NgIdleKeepaliveModule.forRoot(),
    SortablejsModule.forRoot({ animation: 150 })
  ],
  exports: [
    RouterModule
  ],
  providers: [ // expose our Services and Providers into Angular's dependency injection
    ENV_PROVIDERS,
    APP_PROVIDERS
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule {
  constructor(@Inject(PLATFORM_ID) private platformId: Object,
    @Inject(APP_ID) private appId: string) {
    const platform = isPlatformBrowser(platformId) ?
    'in the browser' : 'on the server';
    console.log(`Running ${platform} with appId=${appId}`);
  }
}
