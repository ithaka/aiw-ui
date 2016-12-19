import { Routes, RouterModule } from '@angular/router';
import { Home } from './home';
import { SearchPage } from './search-page';
import { CollectionPage } from './collection-page';
import { ImageGroupPage } from './image-group-page';
import { ClusterPage } from './cluster-page';
import { BrowsePage } from './browse-page';
import { AssociatedPage } from './associated-page';
import { Login } from './login';
import { About } from './about';
import { NoContent } from './no-content';
import { AuthService } from './shared/auth.service';

import { DataResolver } from './app.resolver';


export const ROUTES: Routes = [
  { path: '',      component: Home, canActivate:[AuthService] },
  { path: 'login', component: Login },
  { path: 'home',  component: Home, canActivate:[AuthService] },
  { path: 'search', redirectTo: '/search/*', pathMatch: 'full', canActivate:[AuthService] },
  { path: 'search/', redirectTo: '/search/*', pathMatch: 'full', canActivate:[AuthService] },
  { path: 'search/:term', component: SearchPage, canActivate:[AuthService] },
  { path: 'collection/:colId', component: CollectionPage, canActivate:[AuthService] },
  { path: 'image-group/:igId', component: ImageGroupPage, canActivate:[AuthService] },
  { path: 'cluster/:objectId', component: ClusterPage, canActivate:[AuthService] },
  { path: 'browse', component: BrowsePage, canActivate:[AuthService] },
  { path: 'associated/:objectId/:colId', component: AssociatedPage, canActivate:[AuthService] },
  { path: 'about', component: About },
  { path: '**',    component: NoContent },
];
