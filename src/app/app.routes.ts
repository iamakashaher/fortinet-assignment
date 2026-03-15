import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.Home),
  },
  {
    path: 'builder',
    loadComponent: () => import('./builder/builder.component').then((m) => m.Builder),
  },
  {
    path: 'records/new',
    loadComponent: () => import('./records/new/record-form.component').then((m) => m.RecordForm),
  },
  {
    path: 'records',
    loadComponent: () => import('./records/grid/data-grid.component').then((m) => m.DataGrid),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
