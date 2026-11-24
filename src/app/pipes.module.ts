import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomFilterPipe } from 'src/pipes/custom-filter.pipe';



@NgModule({
  declarations: [
    CustomFilterPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [CustomFilterPipe]
})
export class PipesModule { }
