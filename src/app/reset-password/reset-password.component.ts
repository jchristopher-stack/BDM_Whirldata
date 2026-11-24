import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpMethod } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';
import { ServiceManagerService } from '../service-manager.service';
import { FieldErrors, FormErrors, isBlank, newPasswordError, PASSWORD_HINT } from 'src/components/form-errors';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  activationCode: any ="";
  emailId: any = "";
  password: any = "";
  role: any = "";
  confirmPassword: any = ""
  form = new FormErrors();
  readonly passwordHint = PASSWORD_HINT;
  /** An app user (not a therapist) reset their password; the page says to go back to the app. */
  resetDone: boolean = false;

  constructor(private route: ActivatedRoute, private router: Router, public serviceManager: ServiceManagerService) {
    this.route.queryParams
    .subscribe(async (params: any) => {
      if(params.code && params.email_id){
        this.activationCode = params.code
        this.emailId = params.email_id
        this.role = params.role_id
      }
      else{
        router.navigate(['/sign-in'])
      }
    }
  );
   }

  ngOnInit(): void {
  }

  /** role_id 2 is a therapist; anyone else came from the mobile app. */
  get isTherapist(): boolean {
    return parseInt(this.role) == 2
  }

  resetPassword(){
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
      "password" : this.password,
      "email_id" : this.emailId,
      "role_id": parseInt(this.role),
      "activation_code": window.atob(decodeURIComponent(this.activationCode))
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: true,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('user/verify-password', body, HttpMethod.POST, customOptions, false).subscribe( (data: any)=>{
      if(data){
        if(this.isTherapist){
          this.serviceManager.navigateToPage('/sign-in')
        }
        else{
          this.resetDone = true
        }
      }
    }, (error: any) =>{
      console.log(error)
    })
  }
}
