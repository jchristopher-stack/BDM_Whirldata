import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { PrimengModule } from '../primeng.module';
import { UiPreviewComponent } from './ui-preview.component';

/**
 * Design playground at /ui-preview. Lazy-loaded and only routed in
 * non-production builds (see app-routing.module.ts), so it never ships to
 * users and stays out of the main bundle.
 */
@NgModule({
  declarations: [UiPreviewComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgxChartsModule,
    PrimengModule,
    RouterModule.forChild([{ path: '', component: UiPreviewComponent }]),
  ],
})
export class UiPreviewModule { }
