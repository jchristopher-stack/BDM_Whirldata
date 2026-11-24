import { Component, OnInit } from '@angular/core';
import {Location} from '@angular/common';
import { AddClientService } from '../therapist-home.service';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';
import { HttpMethod } from 'src/constants/constant';
import { ServiceManagerService } from 'src/app/service-manager.service';
import { Router } from '@angular/router';
import { phoneNumberError } from 'src/components/phone-input/phone-input.component';
import { FieldErrors, FormErrors, emailError, isBlank } from 'src/components/form-errors';

@Component({
  selector: 'app-add-client',
  templateUrl: './add-client.component.html',
  styleUrls: ['./add-client.component.css']
})
export class AddClientComponent implements OnInit {

  readonly MAX_POV = 4
  form = new FormErrors();
  /** Names offered by the purpose-of-visit autocomplete (not yet picked, matching what's typed). */
  povSuggestions: string[] = []
  selectedPovList: any = []
  povInput: any = ""
  clientId: any =""
  showCancelDeleteConfirm: boolean = false;
  constructor(public clientForm: AddClientService, private serviceManager: ServiceManagerService, private router: Router, public location: Location) {
    clientForm.resetForm()
    this.clientId = localStorage.getItem("currentClient")
    if(this.clientId){
      this.getClientDetails()
    }
    else{
      this.getPOV()
    }
   }

  povList: any = []
  povListCopy: any = []
  
  ngOnInit(): void {
  }

  /** Fills the autocomplete: the therapist's own purposes not yet picked, matching the query. */
  filterPov(query: string): void {
    const filterValue = String(query || "").trim().toLowerCase()
    this.povSuggestions = this.povList
      .map((option: any) => option.purpose_of_visit_name)
      .filter((name: string) => name.toLowerCase().includes(filterValue))
  }

  /** Enter in the box adds what was typed, unless the autocomplete already used it to pick a suggestion. */
  onPovEnter(event: Event): void {
    if(event.defaultPrevented){
      return
    }
    event.preventDefault()
    this.addPov()
  }

  getClientDetails(){
    return new Promise((resolve, reject)=> {
      var therapistId = localStorage.getItem("therapist_id")
      var body = {
        "client_id": this.clientId,
        "therapist_id": therapistId
      }
      const customOptions : HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: false,
        createLoaderAction: false
      }
      this.serviceManager.CallBackendServiceAPI('therapist/get-client-info', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
        if(data){
          var response = data.data
          this.clientForm = response[0]
          this.selectedPovList = this.clientForm.purpose_of_visit.map((e: any) => e.purpose_of_visit_name)
          this.getPOV()
          resolve(true)
        }
      }, (error: any) =>{
        console.log(error)
        reject(false)
      })
    })

  }

  /**
   * Adds every purpose typed in the box. "Anxiety, Sleep" becomes two purposes
   * instead of one called "Anxiety, Sleep" (sheet #21). Blank and duplicate
   * entries are skipped, and the max of 4 still applies.
   */
  async addPov() {
    var names: string[] = []
    String(this.povInput || "").split(",").forEach((part: string) => {
      var name = part.trim()
      var isDuplicate = [...this.selectedPovList, ...names].some((n: any) => n.toLowerCase() == name.toLowerCase())
      if(name && !isDuplicate){
        names.push(name)
      }
    })
    if(!names.length){
      return
    }
    var room = this.MAX_POV - this.selectedPovList.length
    if(room <= 0){
      this.serviceManager.showMessage("Reached maximum limit")
      return
    }
    if(names.length > room){
      this.serviceManager.showMessage("Only 4 purposes of visit can be added. Extra ones were skipped.")
      names = names.slice(0, room)
    }
    this.povInput = ""
    for(const name of names){
      await this.addPovName(name)
    }
  }

  private addPovName(name: string){
    return new Promise((resolve) => {
      var existing = this.povListCopy.find((pov : any) => pov.purpose_of_visit_name.toLowerCase() == name.toLowerCase())
      if(existing){
        // Use the stored spelling: addClients() matches on it exactly.
        this.selectedPovList.push(existing.purpose_of_visit_name)
        resolve(true)
        return
      }
      var therapistId = localStorage.getItem("therapist_id")
      var body = {
        "therapist_id": therapistId,
        "purpose_of_visit_name": name
      }
      const customOptions : HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: false,
        createLoaderAction: false
      }
      this.serviceManager.CallBackendServiceAPI('therapist/add-purpose-of-visit', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
        if(data){
          var response = data.data
          this.selectedPovList.push(response.purpose_of_visit_name)
          this.povList.push(response)
          this.povListCopy.push(response)
          this.refreshPov()
        }
        resolve(true)
      }, (error: any) =>{
        console.log(error)
        resolve(false)
      })
    })
  }

  remove(pov: any): void {
    const index = this.selectedPovList.indexOf(pov);
    if (index >= 0) {
      this.selectedPovList.splice(index, 1);
      this.refreshPov()
    }
  }

  isValidForm(){
    const errors: FieldErrors = {}
    if(isBlank(this.clientForm.first_name)){
      errors.first_name = "Enter the client's first name."
    }
    if(isBlank(this.clientForm.last_name)){
      errors.last_name = "Enter the client's last name."
    }
    const emailMessage = emailError(this.clientForm.email_id)
    if(emailMessage){
      errors.email_id = emailMessage
    }
    const phoneMessage = phoneNumberError(this.clientForm.phone_number)
    if(phoneMessage){
      errors.phone_number = phoneMessage
    }
    if(isBlank(this.clientForm.city)){
      errors.city = "Enter the client's city."
    }
    return this.form.set(errors)
  }
  addClients(){
    var therapistId = localStorage.getItem("therapist_id")
    this.clientForm.purpose_of_visit = this.povListCopy.filter((pov: any)=>this.selectedPovList.includes(pov.purpose_of_visit_name)).map((pov: any) => pov.purpose_of_visit_id)
    this.clientForm.therapist_id = therapistId

    if(!this.isValidForm())return
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: true,
      createLoaderAction: true
    }
    var url;
    if(this.clientId){
      url = "therapist/edit-client"
    }
    else{
      url = "therapist/add-client"
    }
    // phone_number is already "+<code>-<digits>" (see PhoneInputComponent).
    var body = {...this.clientForm}
    this.serviceManager.CallBackendServiceAPI(url, body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        var response = data.data
        localStorage.setItem("currentClient", response[0]["client_id"])
        this.serviceManager.navigateToPage("/add-client/add-activity", {
            id: response[0]["client_therapist_mapping_id"]
          })
      }
    }, (error: any) =>{
      console.log(error)
    })

  }



  getPOV(){
    var therapistId = localStorage.getItem("therapist_id")
    var body = {
      "therapist_id": therapistId
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: false,
      showSuccessMessage: false,
      createLoaderAction: false
    }
    this.serviceManager.CallBackendServiceAPI('therapist/get-therapist-pov', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        var response = data.data
        response.sort((a: any, b: any) => a.purpose_of_visit_name.toLowerCase() < b.purpose_of_visit_name.toLowerCase() ? -1 : 1)
        // Keep the full list: addClients() looks up the ids of the picked purposes in it.
        // (It used to drop the picked ones, so going back from step 2 and pressing Next lost them.)
        this.povListCopy = JSON.parse(JSON.stringify(response))
        this.refreshPov()
      }
    }, (error: any) =>{
      console.log(error)
    })
  }

  cancelAddClient(){
    if(!this.clientId)
      this.location.back()
    else{
      // Canceling while editing an existing client deletes it server-side (see
      // confirmDeleteAndCancel) - gate that behind a confirmation so a mislabeled
      // "Cancel" click can't silently destroy real client data.
      this.showCancelDeleteConfirm = true
    }
  }

  confirmDeleteAndCancel(){
    this.showCancelDeleteConfirm = false
    var body = {
      "client_id": this.clientId
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: false,
      showSuccessMessage: false,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('therapist/delete-client', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        this.location.back()
      }
    }, (error: any) =>{
      console.log(error)
    })
  }

  /** A suggestion picked from the autocomplete. */
  selectPovName(name: string): void {
    if(this.selectedPovList.length >= this.MAX_POV){
      this.serviceManager.showMessage("Reached maximum limit")
      return
    }
    this.selectedPovList.push(name);
    // The autocomplete writes the picked name into the model in this same tick; clear it on the next one.
    setTimeout(() => this.povInput = "")
    this.refreshPov()
  }

  refreshPov(){
    this.povList = this.povListCopy.filter((spec: any) => this.selectedPovList.indexOf(spec.purpose_of_visit_name) < 0)
  }
  
}