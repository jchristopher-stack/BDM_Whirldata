import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpMethod } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';
import { ServiceManagerService } from '../service-manager.service';

@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css']
})
export class PrivacyPolicyComponent implements OnInit {

  constructor( public serviceManager: ServiceManagerService, public router: Router) { }
  privacyPolicy: any = ""
  policyLoaded: boolean = false
  /** The policy couldn't be fetched (or there isn't one); Agree stays off and the page offers Retry. */
  policyError: boolean = false
  showLogoutDialog: boolean = false
  ngOnInit(): void {
    this.getPolicy()
  }

  getPolicy(){
    this.policyLoaded = false
    this.policyError = false
    var therapistId = localStorage.getItem("therapist_id")
    var body = {
      "therapist_id" : therapistId,
      "role_id": 2
    }
    const customOptions : HttpCustomOptions = {
      // The page shows its own error with Retry.
      showErrorMessage: false,
      showSuccessMessage: false,
      createLoaderAction: false
    }
    this.serviceManager.CallBackendServiceAPI('therapist/get-privacy-policy', body, HttpMethod.POST, customOptions).subscribe( (data: any)=>{
      var response = data?.data?.[0]
      this.privacyPolicy = response?.policy_content || ""
      this.policyError = !String(this.privacyPolicy).trim()
      this.policyLoaded = true
    }, (error: any) =>{
      console.log(error)
      this.policyError = true
      this.policyLoaded = true
    })
  }

  /** Agree only once there's a policy on screen to agree to. */
  get canAgree(): boolean {
    return this.policyLoaded && !this.policyError
  }

  agreePolicy(){
    if(!this.canAgree){
      return
    }
    var therapistId = localStorage.getItem("therapist_id")
    var body = {
      "therapist_id" : therapistId,
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: true,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('therapist/modify-privacy-policy', body, HttpMethod.POST, customOptions).subscribe( (data: any)=>{
      if(data){
        var response = data.data[0]
        localStorage.setItem("isAgree", "true")
        this.serviceManager.navigateToPage('/clients')
      }
    }, (error: any) =>{
      console.log(error)
    })
  }

}
