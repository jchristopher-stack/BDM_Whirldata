import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ServiceManagerService } from 'src/app/service-manager.service';
import { HttpMethod } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';
import { FieldErrors, FormErrors, emailError, isBlank } from 'src/components/form-errors';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  email: any = "";
  activationCode: any = "";
  form = new FormErrors();
  constructor(public serviceManager: ServiceManagerService, private router: Router) { 
    serviceManager.navToValidRoute()
  }

  ngOnInit(): void {
  }

  setActivationCode(){
    if(this.activationCode.trim().length == 3){
      this.activationCode += '-'
    }
  }

  removeActivationCode(){
    if(this.activationCode.trim().length == 4){
      this.activationCode = this.activationCode.slice(0, -1)
    }
  }

  signUpUser(){
    const errors: FieldErrors = {}
    const emailMessage = emailError(this.email)
    if(emailMessage){
      errors.email = emailMessage
    }
    if(isBlank(this.activationCode)){
      errors.activation_code = "Enter the activation code from your invite email."
    }
    if(!this.form.set(errors)){
      return
    }

    if(this.activationCode.trim() && !this.activationCode.includes('-')){
      this.activationCode = this.activationCode.slice(0,3) + '-'+ this.activationCode.slice(3)
    }
    var body = {
      "email_id" : this.email.trim(),
      "activation_code": this.activationCode.trim()
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: true,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('therapist/sign-up', body, HttpMethod.POST, customOptions, false).subscribe( (data: any)=>{
      if(data){
        var response = data.data[0]
        localStorage.setItem("therapist_id", response.therapist_id)
        this.serviceManager.navigateToPageWithState('/set-password', 
        { 
          therapist_id: response.therapist_id,
          email: this.email.trim(),
          activation_code: this.activationCode.trim()
          })
      }
    }, (error: any) =>{
      console.log(error)
    })
  }

}
