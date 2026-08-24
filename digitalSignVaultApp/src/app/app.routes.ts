import { Routes } from '@angular/router';
export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./signature-demo.component').then((m) => m.SignatureDemoComponent),
	},
];
