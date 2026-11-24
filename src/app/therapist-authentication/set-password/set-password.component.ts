import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ServiceManagerService } from 'src/app/service-manager.service';
import { HttpMethod } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';
import { FieldErrors, FormErrors, isBlank, newPasswordError, PASSWORD_HINT } from 'src/components/form-errors';

@Component({
  selector: 'app-set-password',
  templateUrl: './set-password.component.html',
  styleUrls: ['./set-password.component.css']
})
export class SetPasswordComponent implements OnInit {

  therapistId: any;
  emailId: any;
  activationCode: any;
  password: any;
  confirmPassword: any;
  form = new FormErrors();
  readonly passwordHint = PASSWORD_HINT;
  constructor(public router: Router, public serviceManager: ServiceManagerService, private cookieService: CookieService) {
    serviceManager.navToValidRoute()
    var state = this.router.getCurrentNavigation()?.extras?.state
    if(!state?.['therapist_id']){
      router.navigate(['/sign-up'])
    }
    else{
      this.therapistId = state['therapist_id']
      this.emailId = state['email']
      this.activationCode = state["activation_code"]

    }
   }

  ngOnInit(): void {
  }

  setPassword(){
    const errors: FieldErrors = {}
    var passwordMessage = newPasswordError(this.password)
    if(passwordMessage){
      errors.password = passwordMessage
    }
    if(isBlank(this.confirmPassword)){
      errors.confirm_password = "Re-enter the password."
    }
    else if(this.password != this.confirmPassword){
      errors.confirm_password = "The passwords don't match."
    }
    if(!this.form.set(errors)){
      return
    }
    var body = {
      "password" : this.password.trim(),
      "therapist_id": this.therapistId,
      "email_id" : this.emailId,
      "activation_code": this.activationCode
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: true,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('therapist/set-password', body, HttpMethod.POST, customOptions, false).subscribe( (data: any)=>{
      if(data){
        var response = data.data[0]
        if(response.id_token){
          this.cookieService.set("idToken", response.id_token, 0.125)
          localStorage.setItem("therapist_id", response.therapist_id)
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
