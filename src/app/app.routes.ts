import { Routes, RouterModule } from '@angular/router'

// Project Dependencies
import { Home } from './home'
import { SearchPage } from './search-page'
import { CollectionPage } from './collection-page'
import { PCollectionPage } from './pcollection-page';
import { CategoryPage } from './category-page'
import { ImageGroupPPPage } from './image-group-pp-page'
import { AssetPPPage } from './asset-pp-page'
import { ImageGroupPage } from './image-group-page'
import { ClusterPage } from './cluster-page'
import { BrowsePage } from './browse-page'
import { AssociatedPage } from './associated-page'
import { AssetPage } from './asset-page'
import { Login } from './login'
import { RegisterComponent } from './register/register.component'
import { NoContent } from './no-content'
import { AuthService } from './shared/auth.service'
// import { DataResolver } from './app.resolver'
import { BrowseRoutes } from './browse-page/browse-page.routes'
import { AccountPage } from './account-page/account-page.component'
import { LegacyRouteResolver } from './legacy.service'
import { LinkPage } from './link-page'


export const ROUTES: Routes = [
  { path: '', component: Home, canActivate: [AuthService], pathMatch: 'full' },
  // Simple legacy redirects
  { path: '1', redirectTo: '', canActivate: [AuthService], pathMatch: 'full'},
  // "Hashbang" support for sitemap
  { path: '!', redirectTo: '', canActivate: [AuthService], pathMatch: 'full' },
  { path: '!/asset/:assetId', redirectTo: 'asset/:assetId', pathMatch: 'full' },
  { path: '!/collection/:colId', redirectTo: 'collection/:colId', pathMatch: 'full' },
  { path: '!/category/:colId', redirectTo: 'category/:colId', pathMatch: 'full' },
  // Component Routes
  { path: 'account', component: AccountPage, canActivate: [AuthService] },
  { path: 'login', component: Login },
  { path: 'home',  component: Home, canActivate: [AuthService] },
  { path: 'search/', redirectTo: '/search/*', pathMatch: 'full', canActivate: [AuthService] },
  { path: 'asset/:assetId', component: AssetPage, pathMatch: 'full' },
  { path: 'object/:assetId', redirectTo: '/asset/:assetId', pathMatch: 'full' },
  { path: 'asset/external/:encryptedId', component: AssetPage, pathMatch: 'full' },
  { path: 'search/:term', component: SearchPage, canActivate: [AuthService] },
  { path: 'search', component: SearchPage, pathMatch: 'full', canActivate: [AuthService] },
  { path: 'collection/:colId', component: CollectionPage, canActivate: [AuthService] },
  { path: 'collection', component: CollectionPage, canActivate: [AuthService] },
  { path: 'pcollection/:pcolId', component: PCollectionPage, canActivate: [AuthService] },
  { path: 'pcollection', component: PCollectionPage, canActivate: [AuthService] },
  { path: 'printpreview/:igId', component: ImageGroupPPPage, canActivate: [AuthService] },
  { path: 'assetprint/:assetId', component: AssetPPPage },
  { path: 'category/:catId', component: CategoryPage, canActivate: [AuthService] },
  { path: 'category', component: CategoryPage, canActivate: [AuthService] },
  { path: 'group/:igId', component: ImageGroupPage, canActivate: [AuthService] },
  { path: 'group', component: ImageGroupPage, canActivate: [AuthService] },
  { path: 'cluster/:clusterId', component: ClusterPage, canActivate: [AuthService] },
  { path: 'cluster', component: ClusterPage, canActivate: [AuthService] },
  { path: 'browse', component: BrowsePage, canActivate: [AuthService], children: BrowseRoutes },
  { path: 'associated/:objectId', component: AssociatedPage, canActivate: [AuthService] },
  { path: 'associated', component: AssociatedPage, canActivate: [AuthService] },
  { path: 'register', component: RegisterComponent, canActivate: [AuthService] },
  { path: 'link', component: LinkPage },
  { path: 'library', children: [
    { path: '**', component: NoContent, resolve: [LegacyRouteResolver] }
  ] },
  { path: '**', component: NoContent, resolve: [LegacyRouteResolver] }
]
