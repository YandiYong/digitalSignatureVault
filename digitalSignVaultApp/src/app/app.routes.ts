import { Routes } from '@angular/router';
export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('@yandiswanpm/digital-signature').then((m) => m.DsvPageComponent),
	},
];
