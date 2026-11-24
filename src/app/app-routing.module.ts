import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './auth.guard';

import { AddClientComponent } from './therapist-home/add-client/add-client.component';
import { ClientActivitiesComponent } from './client-activities/client-activities.component';
import { ClientDetailsComponent } from './therapist-home/client-details/client-details.component';
import { ClientAddActivitySessionComponent } from './client-add-activity-session/client-add-activity-session.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { ForgotPasswordComponent } from './therapist-authentication/forgot-password/forgot-password.component';
import { HomePageComponent } from './therapist-home/home-page/home-page.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { SigninComponent } from './therapist-authentication/signin/signin.component';
import { SetPasswordComponent } from './therapist-authentication/set-password/set-password.component';
import { SignupComponent } from './therapist-authentication/signup/signup.component';
import { TherapistAddActivityComponent } from './therapist-add-activity/therapist-add-activity.component';
import { TherapistNotificationComponent } from './therapist-notification/therapist-notification.component';
import { TherapistProfileComponent } from './therapist-profile/therapist-profile.component';
import { previewRoutes } from './preview-routes';

const routes: Routes = [
  ...previewRoutes,
  {
    path:"sign-up",
    data: { title: 'Sign up' },
    component:SignupComponent
  },
  {
    path:"",
    redirectTo:"clients",
    pathMatch:"full"
  },
  {
    path:"sign-in",
    data: { title: 'Sign in' },
    component:SigninComponent
  },
  {
    path:"forgot-password",
    data: { title: 'Forgot password' },
    component:ForgotPasswordComponent
  },
  {
    path:"client/add-activity",
    data: { title: 'Add activity' },
    component: ClientAddActivitySessionComponent,
    canActivate: [AuthGuard]
    
  },
  {
    path:"client/edit-activity",
    data: { title: 'Edit activity' },
    component: ClientAddActivitySessionComponent,
    canActivate: [AuthGuard]
  },
  {
    path:"client/add-session",
    data: { title: 'New session' },
    component: ClientAddActivitySessionComponent,
    canActivate: [AuthGuard]
  },
  {
    path:"set-password",
    data: { title: 'Set password' },
    component:SetPasswordComponent
  },
  {
    path:"clients",
    data: { title: 'Clients' },
    component:HomePageComponent,
    canActivate: [AuthGuard]
  },
  {
    path:"add-client",
    data: { title: 'Add client' },
    component:AddClientComponent,
    canActivate: [AuthGuard]
  },
  {
    path:"add-client/add-activity",
    data: { title: 'Add activities' },
    component:TherapistAddActivityComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "clients/client-details",
    data: { title: 'Client details' },
    component: ClientDetailsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "notifications",
    data: { title: 'Notifications' },
    component: TherapistNotificationComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "client/activity",
    data: { title: 'Activity details' },
    component: ClientActivitiesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "settings",
    data: { title: 'Settings' },
    component: TherapistProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "privacy-policy",
    data: { title: 'Privacy policy' },
    component: PrivacyPolicyComponent,
    canActivate: [AuthGuard]
  },
  {
    path: "reset-password",
    data: { title: 'Reset password' },
    component: ResetPasswordComponent
  },
  // Anything else: a full-page 404 (no sidebar).
  {
    path: "**",
    component: NotFoundComponent,
    data: { title: 'Page not found', hideSidebar: true }
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
