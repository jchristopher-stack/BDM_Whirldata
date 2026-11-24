import { Routes } from '@angular/router';

/**
 * The /ui-preview design playground, for local work only. Production builds
 * swap this file for preview-routes.prod.ts (see angular.json), so the
 * preview isn't built or shipped at all.
 */
export const previewRoutes: Routes = [
  {
    path: "ui-preview",
    data: { title: 'UI preview' },
    loadChildren: () => import('./ui-preview/ui-preview.module').then(m => m.UiPreviewModule)
  },
];
