import { Routes } from '@angular/router';

import { LibraryComponent } from '.';

export const BrowseRoutes: Routes = [
  { path: '', redirectTo: 'library', pathMatch: 'full'},
  { path: 'library', component: LibraryComponent }
];