import { Routes } from '@angular/router'

import { LibraryComponent, BrowseCommonsComponent, MyCollectionsComponent,
  BrowseInstitutionComponent, BrowseGroupsComponent } from '.'

import { GroupsRouteResolver } from './groups-redirect.service'
import { NoContent } from './../no-content'

export const BrowseRoutes: Routes = [
  { path: '', redirectTo: 'library', pathMatch: 'full'},
  { path: 'library', component: LibraryComponent },
  { path: 'institution', component: BrowseInstitutionComponent },
  { path: 'commons', component: BrowseCommonsComponent },
  { path: 'mycollections', component: MyCollectionsComponent },
  { path: 'groups/:level', component: NoContent, resolve: [GroupsRouteResolver] },
  // { path: 'groups/:level', redirectTo: '/browse/groups' },
  { path: 'groups', component: BrowseGroupsComponent }
]
