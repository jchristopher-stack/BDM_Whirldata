import { NgModule } from '@angular/core';
import { SharedModule } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MenuModule } from 'primeng/menu';
import { MultiSelectModule } from 'primeng/multiselect';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PasswordModule } from 'primeng/password';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RippleModule } from 'primeng/ripple';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

@NgModule({
  exports: [
    AutoCompleteModule,
    ButtonModule,
    CalendarModule,
    CheckboxModule,
    ChipModule,
    DialogModule,
    DropdownModule,
    InputSwitchModule,
    InputTextModule,
    InputTextareaModule,
    MenuModule,
    MultiSelectModule,
    OverlayPanelModule,
    PasswordModule,
    RadioButtonModule,
    RippleModule,
    SelectButtonModule,
    SharedModule,
    SkeletonModule,
    ToastModule,
    TooltipModule,
  ],
  declarations: []
})
export class PrimengModule {}
