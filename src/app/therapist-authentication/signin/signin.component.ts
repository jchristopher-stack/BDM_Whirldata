import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ServiceManagerService } from 'src/app/service-manager.service';
import { HttpMethod } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';
import { FieldErrors, FormErrors, emailError, isBlank } from 'src/components/form-errors';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {

  email: any = "";
  password: any = "";
  form = new FormErrors();
  constructor(private serviceManager: ServiceManagerService, private router: Router,  private cookieService: CookieService) { 
    serviceManager.navToValidRoute()
  }

  ngOnInit(): void {
  }

  signInUser(){
    const errors: FieldErrors = {}
    const emailMessage = emailError(this.email)
    if(emailMessage){
      errors.email = emailMessage
    }
    if(isBlank(this.password)){
      errors.password = "Enter your password."
    }
    if(!this.form.set(errors)){
      return
    }
    var body = {
      "email_id" : this.email.trim(),
      "password": this.password.trim()
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: true,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('therapist/sign-in', body, HttpMethod.POST, customOptions, false).subscribe( async (data: any)=>{
      if(data){
        var response = data.data[0]
        if(response.id_token){
          localStorage.setItem("therapist_id", response.therapist_id)
          this.cookieService.set("idToken", response.id_token, 0.125)
          localStorage.setItem("timezone", response.timezone)
          this.serviceManager.checkPolicy().then((policy: any) => {
            if(policy){
              this.router.navigate(['/clients'])
            }
            else{
              this.router.navigate(['/privacy-policy'])
            }
          }).catch((error: any)=>{
              this.router.navigate(['/privacy-policy'])
          })
        }
      }
    }, (error: any) =>{
      console.log(error)
    })
  }
}
