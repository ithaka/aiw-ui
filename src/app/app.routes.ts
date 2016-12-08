import { Routes, RouterModule } from '@angular/router';
import { Home } from './home';
import { Search } from './search';
import { Login } from './login';
import { About } from './about';
import { NoContent } from './no-content';
import { AuthService } from './shared/auth.service';

import { DataResolver } from './app.resolver';


export const ROUTES: Routes = [
  { path: '',      component: Home, canActivate:[AuthService] },
  { path: 'login', component: Login },
  { path: 'home',  component: Home, canActivate:[AuthService] },
  { path: 'about', component: About },
  { path: 'search', component: Search, canActivate:[AuthService] },
  {
    path: 'detail', loadChildren: () => System.import('./+detail')
  },
  { path: '**',    component: NoContent },
];
