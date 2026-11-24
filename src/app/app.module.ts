import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { NgxChartsModule }from '@swimlane/ngx-charts';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AddClientComponent } from './therapist-home/add-client/add-client.component';
import { AppRoutingModule } from './app-routing.module';
import { ClientActivitiesComponent } from './client-activities/client-activities.component';
import { ClientDetailsComponent } from './therapist-home/client-details/client-details.component';
import { ClientAddActivitySessionComponent } from './client-add-activity-session/client-add-activity-session.component';
import { ForgotPasswordComponent } from './therapist-authentication/forgot-password/forgot-password.component';
import { HomePageComponent } from './therapist-home/home-page/home-page.component';
import { ConfirmDialogComponent } from 'src/components/confirm-dialog/confirm-dialog.component';
import { MessagePopComponent } from 'src/components/message-pop/message-pop.component';
import { PhoneInputComponent } from 'src/components/phone-input/phone-input.component';
import { PasswordFieldComponent } from 'src/components/password-field/password-field.component';
import { AuthLayoutComponent } from 'src/components/auth-layout/auth-layout.component';
import { SkeletonComponent } from 'src/components/skeleton/skeleton.component';
import { LoaderPopComponent } from 'src/components/loader-pop/loader-pop.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { PipesModule } from './pipes.module';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { SigninComponent } from './therapist-authentication/signin/signin.component';
import { SignupComponent } from './therapist-authentication/signup/signup.component';
import { SetPasswordComponent } from './therapist-authentication/set-password/set-password.component';
import { TherapistAddActivityComponent } from './therapist-add-activity/therapist-add-activity.component';
import { TherapistNotificationComponent } from './therapist-notification/therapist-notification.component'
import { TherapistProfileComponent } from './therapist-profile/therapist-profile.component';
import { PrimengModule } from './primeng.module';

import { OverlayModule } from '@angular/cdk/overlay';
import { MessageService } from 'primeng/api';

@NgModule({
  declarations: [
    AppComponent,
    AddClientComponent,
    ClientActivitiesComponent,
    ClientAddActivitySessionComponent,
    ClientDetailsComponent,
    ConfirmDialogComponent,
    ForgotPasswordComponent,
    LoaderPopComponent,
    MessagePopComponent,
    PhoneInputComponent,
    PasswordFieldComponent,
    AuthLayoutComponent,
    PrivacyPolicyComponent,
    HomePageComponent,
    NotFoundComponent,
    SideBarComponent,
    SkeletonComponent,
    SigninComponent,
    SignupComponent,
    SetPasswordComponent,
    ResetPasswordComponent,
    TherapistAddActivityComponent,
    TherapistNotificationComponent,
    TherapistProfileComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    NgxChartsModule,
    // CDK overlay for the phone input's country list (no Angular Material).
    OverlayModule,
    PrimengModule,
    PipesModule,
    ReactiveFormsModule
  ],
  providers: [
    // One app-wide toast (see MessagePopComponent).
    MessageService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
