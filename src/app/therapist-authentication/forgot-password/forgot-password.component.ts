import { Component, OnInit } from '@angular/core';
import { ServiceManagerService } from 'src/app/service-manager.service';
import { HttpMethod } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';
import {Location} from '@angular/common';
import { Router } from '@angular/router';
import { FormErrors, emailError } from 'src/components/form-errors';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {

  email: any;
  form = new FormErrors();
  /** The reset link went out; the page shows "Check your email" instead of the form. */
  linkSent: boolean = false;
  constructor(private serviceManager: ServiceManagerService, public location: Location, private router: Router) { 
    serviceManager.navToValidRoute()
  }

  ngOnInit(): void {
  }

  forgotPassword(){
    const emailMessage = emailError(this.email)
    if(!this.form.set(emailMessage ? { email: emailMessage } : {})){
      return
    }
    var body = {
      "email_id" : this.email.trim(),
      "role_id": 2
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      // The page itself says the link was sent.
      showSuccessMessage: false,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('user/forgot-password', body, HttpMethod.POST, customOptions, false).subscribe( (data: any)=>{
      if(data){
        this.linkSent = true
      }
    }, (error: any) =>{
      console.log(error)
    })

  }
}
