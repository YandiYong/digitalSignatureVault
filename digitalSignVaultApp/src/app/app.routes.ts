import { Routes } from '@angular/router';
export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./Components/dsv/dsv-page.component').then((m) => m.DsvPageComponent),
	},
];
