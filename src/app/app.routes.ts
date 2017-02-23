import { Routes, RouterModule } from '@angular/router';
import { Home } from './home';
import { SearchPage } from './search-page';
import { CollectionPage } from './collection-page';
import { CategoryPage } from './category-page';
import { ImageGroupPPPage } from './image-group-pp-page';
import { ImageGroupPage } from './image-group-page';
import { ClusterPage } from './cluster-page';
import { BrowsePage } from './browse-page';
import { AssociatedPage } from './associated-page';
import { AssetPage } from './asset-page';
import { Login } from './login';
import { RegisterComponent } from './register/register.component';
import { About } from './about';
import { NoContent } from './no-content';
import { AuthService } from './shared/auth.service';

import { DataResolver } from './app.resolver';
import { BrowseRoutes } from './browse-page/browse-page.routes';


export const ROUTES: Routes = [
  { path: '', component: Home, canActivate:[AuthService], pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'home',  component: Home, canActivate:[AuthService] },
  { path: 'search/', redirectTo: '/search/*', pathMatch: 'full', canActivate:[AuthService] },
  { path: 'asset/:assetId', component: AssetPage, pathMatch: 'full', canActivate:[AuthService] },
  { path: 'search/:term', component: SearchPage, canActivate:[AuthService] },
  { path: 'search', component: SearchPage, pathMatch: 'full', canActivate:[AuthService] },
  { path: 'collection/:colId', component: CollectionPage, canActivate:[AuthService] },
  { path: 'collection', component: CollectionPage, canActivate:[AuthService] },
  { path: 'printpreview/:igId', component: ImageGroupPPPage, canActivate:[AuthService] },
  { path: 'category/:catId', component: CategoryPage, canActivate:[AuthService] },
  { path: 'category', component: CategoryPage, canActivate:[AuthService] },
  { path: 'subcategory/:catId', component: CategoryPage, canActivate:[AuthService] },
  { path: 'subcategory', component: CategoryPage, canActivate:[AuthService] },
  { path: 'group/:igId', component: ImageGroupPage, canActivate:[AuthService] },
  { path: 'group', component: ImageGroupPage, canActivate:[AuthService] },
  { path: 'cluster/:objectId', component: ClusterPage, canActivate:[AuthService] },
  { path: 'cluster', component: ClusterPage, canActivate:[AuthService] },
  { path: 'browse', component: BrowsePage, canActivate:[AuthService], children: BrowseRoutes },
  { path: 'associated/:objectId/:colId', component: AssociatedPage, canActivate:[AuthService] },
  { path: 'about', component: About },
  { path: 'register', component: RegisterComponent, canActivate: [AuthService] },
  { path: '**', component: NoContent }
];
