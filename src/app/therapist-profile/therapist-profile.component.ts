import { Component, OnInit } from '@angular/core';
import { phoneNumberError } from 'src/components/phone-input/phone-input.component';
import { emailError, FieldErrors, FormErrors, isBlank, newPasswordError, PASSWORD_HINT } from 'src/components/form-errors';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { DefaultSpecializationList, GenderList, GenderMapping, HttpMethod, SpecializationMapping, TherapistTimeZones } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';
import { DISPLAY_DATE_FORMAT, ServiceManagerService } from '../service-manager.service';
import * as moment from 'moment';

@Component({
  selector: 'app-therapist-profile',
  templateUrl: './therapist-profile.component.html',
  styleUrls: ['./therapist-profile.component.scss']
})
export class TherapistProfileComponent implements OnInit {
  settingsType = "Profile Details"
  settingsOptions = [
    { label: 'Profile', value: 'Profile Details' },
    // Password and Delete account share one tab, side by side on wide screens.
    { label: 'Account', value: 'Account' }
  ]
  showDeleteDialog: boolean = false;
  // 1 MB matches the default nginx client_max_body_size in front of the API.
  readonly LOGO_MAX_BYTES = 1024 * 1024
  readonly LOGO_EXTENSIONS = ["png", "jpg", "jpeg"]
  currentPassword: any = ""
  newPassword: any = ""
  confirmPassword: any = ""
  readonly passwordHint = PASSWORD_HINT
  profileForm = new FormErrors();
  passwordForm = new FormErrors();
  deleteForm = new FormErrors();
  reasonList: any = []
  reasonsLoaded: boolean = false
  deleteReason: any = ""
  deleteFeedback: any = ""
  therapistDetails: any = {}
  therapistDetailsCopy: any = {}
  /** First load of the profile finished (shows a skeleton until then). */
  detailsLoaded: boolean = false
  editStatus: any = false;
  dob: any = "";
  /** The date of birth as the calendar holds it; turned back into `dob` (DD/MM/YYYY) on save. */
  dobPicked: Date | null = null
  readonly today = new Date()
  readonly dobYearRange = `1930:${new Date().getFullYear()}`
  timezone = TherapistTimeZones;
  genderOptions = GenderList.map((name: string) => ({ label: name, value: GenderMapping[name] }))
  specializationOptions: string[] = DefaultSpecializationList
  specializationList: string[] = []

  /**
   * Creates an instance of therapist profile component.
   * @param serviceManager 
   * @param router 
   * @param httpClient 
   */
  constructor(public serviceManager: ServiceManagerService, private router: Router, public httpClient: HttpClient) { }

  /**
   * Get therapist details on init app
   */
  ngOnInit(): void {
    this.getTherapistDetails()
  }


  /**
   * Uploads profile picture
   * @param event 
   */
  uploadFile(event: any) {
    var therapistId  = localStorage.getItem("therapist_id")
    var file = event.target.files[0]
    // Clear the input so picking the same file again still fires (change).
    event.target.value = ""
    if (!file) {
      return
    }
    var extension = (file.name.split(".").pop() || "").toLowerCase()
    if (!this.LOGO_EXTENSIONS.includes(extension)) {
      this.serviceManager.showMessage("Please choose a PNG or JPG image.")
      return
    }
    if (file.size > this.LOGO_MAX_BYTES) {
      this.serviceManager.showMessage("Logo must be 1 MB or smaller.")
      return
    }
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': this.serviceManager.getUserAuthToken()
      }),
      responseType:  'blob' as 'json'
    }

    var formData = new FormData();
    var body = {
      "therapist_id": therapistId,
      "file_extn": extension
    }
    formData.append("logo", file, file.name);
    formData.append("request", JSON.stringify(body));
    this.serviceManager.showLoader()
    var url = this.serviceManager.getBackendUrl() + "therapist/add-logo"
    this.httpClient.post(url, formData, httpOptions).subscribe((data: any) => {
      if (!data) {
        this.serviceManager.hideLoader()
        return
      }
      let reader = new FileReader();
      reader.addEventListener("load", () => {
          this.serviceManager.therapistLogo = reader.result;
          this.serviceManager.hideLoader()
      }, false);
      reader.readAsDataURL(data);
    },(error: any)=>{
      console.log(error);
      // Previously the spinner stayed up forever and nothing was shown.
      this.serviceManager.hideLoader()
      this.serviceManager.showMessage("Logo upload failed. Please try again.")
    });
  }

  /**
   * Triggers file choose option
   * @param fileInput 
   */
  triggerFile(fileInput:HTMLInputElement) {
    fileInput.click();
  }

  /** "+1-5557098456" as "+1 5557098456". */
  phoneDisplay(): string {
    return String(this.therapistDetails.phone_number || "").replace("-", " ")
  }

  /**
   * Changes password
   */
  changePassword(){
    const errors: FieldErrors = {}
    if(isBlank(this.currentPassword)){
      errors.current_password = "Enter your current password."
    }
    var newPasswordMessage = newPasswordError(this.newPassword, "Enter a new password.")
    if(newPasswordMessage){
      errors.new_password = newPasswordMessage
    }
    if(isBlank(this.confirmPassword)){
      errors.confirm_password = "Re-enter the new password."
    }
    else if(this.newPassword != this.confirmPassword){
      errors.confirm_password = "The passwords don't match."
    }
    if(!this.passwordForm.set(errors)){
      return
    }
    var therapistId = localStorage.getItem("therapist_id")
      var body = {
        "therapist_id": therapistId,
        "current_password": this.currentPassword,
        "new_password": this.newPassword
      }
      const customOptions : HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: true,
        createLoaderAction: true
      }
      this.serviceManager.CallBackendServiceAPI('therapist/change-password', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
        if(data){
          this.serviceManager.logoutTherapist()
        }
      }, (error: any) =>{
        console.log(error)
    })
  }

  /**
   * Determines whether toggle change on
   */
  onToggleChange(){
    this.passwordForm.reset()
    this.deleteForm.reset()
    if(this.settingsType == "Profile Details"){
      this.getTherapistDetails()
    }
    else{
      this.currentPassword = ""
      this.newPassword=""
      this.confirmPassword=""
      this.getDeleteReason()
    }
  }

  /**
   * Gets delete reason
   */
  getDeleteReason(){
      var body = {
        "role_id": 2
      }
      const customOptions : HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: false,
        createLoaderAction: false
      }
      this.reasonsLoaded = false
      this.serviceManager.CallBackendServiceAPI('therapist/get-reasons', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
        if(data){
          this.reasonList =data.data
        }
        this.reasonsLoaded = true
      }, (error: any) =>{
        console.log(error)
        this.reasonsLoaded = true
    })
  }

  /**
   * Toggles delete modal
   */
  toggleDeleteModal(){
    // A reason is required only when there are reasons to choose from.
    var missingReason = this.reasonList.length && !this.deleteReason
    if(!this.showDeleteDialog && !this.deleteForm.set(missingReason ? { reason: "Choose a reason." } : {})){
      return
    }
    this.showDeleteDialog = !this.showDeleteDialog;
  }

  /**
   * Deletes account
   */
  deleteAccount(){
    var therapist = localStorage.getItem('therapist_id')
    var body = {
      // The column is nullable; "" would fail as an integer foreign key.
      "reason_id": this.deleteReason || null,
      "other": this.deleteFeedback,
      "therapist_id": therapist

    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: false,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('therapist/delete-therapist', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        this.serviceManager.logoutTherapist()
      }
    }, (error: any) =>{
      console.log(error)
  })
}

/**
 * Gets therapist details
 */
getTherapistDetails(){
  this.editStatus = false
  this.specializationList = []
  var therapistId = localStorage.getItem("therapist_id")
  var body = {
    "therapist_id": therapistId

  }
  const customOptions : HttpCustomOptions = {
    showErrorMessage: true,
    showSuccessMessage: false,
    createLoaderAction: false
  }
  this.serviceManager.CallBackendServiceAPI('therapist/get-details', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
    if(data){
      this.therapistDetails = data.data[0]
      var timezone = TherapistTimeZones.filter((e: any)=> e["format"] == this.therapistDetails.timezone)[0]
      localStorage.setItem("timezone", this.therapistDetails.timezone)
      this.therapistDetails.timezone_name = timezone["name"]
      this.therapistDetails.timezone_id = timezone["id"]
      this.therapistDetailsCopy = JSON.parse(JSON.stringify(this.therapistDetails))
      this.setTherapistData()
    }
    this.detailsLoaded = true
  }, (error: any) =>{
    console.log(error)
    this.detailsLoaded = true
  })
}

/**
 * Cancels profile update
 */
cancelProfileUpdate(){
  this.editStatus = false
  this.profileForm.reset()
  this.specializationList = []
  this.therapistDetails  = JSON.parse(JSON.stringify(this.therapistDetailsCopy))
  this.setTherapistData()
}

/**
 * Sets therapist data
 */
setTherapistData(){
  // DOB is a calendar date stored as UTC midnight - format it in UTC so it can't shift a day.
  this.dob = moment.utc(this.therapistDetails.dob).format(DISPLAY_DATE_FORMAT)
  var picked = moment(this.dob, DISPLAY_DATE_FORMAT, true)
  this.dobPicked = picked.isValid() ? picked.toDate() : null
  this.specializationList = []
  for(var spec in SpecializationMapping){
    if(this.therapistDetails.specialization.includes(SpecializationMapping[spec])){
      this.specializationList.push(spec)
    }
  }
}
/**
 * Enables edit
 */
enableEdit(){
  this.editStatus = true
}

/**
 * Keeps the gender name in step with the id (the backend saves gender_id; the read view shows the name)
 * @param genderId 
 */
selectGender(genderId: number){
  this.therapistDetails.gender_id = genderId
  this.therapistDetails.gender_name = this.genderOptions.find((g: any) => g.value == genderId)?.label || ""
  this.profileForm.clear('gender')
}

/** Street, apartment, then "City ZIP", skipping blanks. */
clinicAddress(): string {
  var details = this.therapistDetails
  var cityLine = [details.address_town_city, details.address_zip_code].filter((part: any) => !isBlank(part)).join(" ")
  return [details.address_street_name, details.address_apartment, cityLine].filter((part: any) => !isBlank(part)).join(", ")
}

/**
 * Saves time zone
 * @param time 
 */
saveTimeZone(time: any){
  this.therapistDetails.timezone_name = time["name"]
  this.therapistDetails.timezone_id = time["id"]
  this.therapistDetails.timezone = time["format"]
}

/**
 * Saves the time zone picked in the dropdown, which reports only its name
 * @param name 
 */
selectTimeZoneByName(name: string){
  const time = this.timezone.find((t: any) => t.name == name)
  if(time){
    this.saveTimeZone(time)
  }
}

/**
 * Sets date value
 */
setDateValue(){
  if(this.dob.length == 2 || this.dob.length ==5){
    this.dob += '/'
  }
}

/**
 * Removes date value
 */
removeDateValue(){
  if(this.dob.length == 6 || this.dob.length == 3){
    this.dob = this.dob.slice(0, -1)
  }
}

/**
 * Updates therapist details
 */
updateTherapistDetails(){
  const customOptions : HttpCustomOptions = {
    showErrorMessage: true,
    showSuccessMessage: true,
    createLoaderAction: true
  }
  this.dob = this.dobPicked ? moment(this.dobPicked).format(DISPLAY_DATE_FORMAT) : ""
  this.therapistDetails.dob = this.serviceManager.parseDisplayDate(this.dob);
  const errors: FieldErrors = {}
  if(isBlank(this.therapistDetails.first_name)){
    errors.first_name = "Enter your first name."
  }
  if(isBlank(this.therapistDetails.last_name)){
    errors.last_name = "Enter your last name."
  }
  if(this.therapistDetails.dob == "Invalid Date"){
    errors.dob = this.dobPicked ? "Enter the date as DD/MM/YYYY." : "Enter your date of birth."
  }
  var mailError = emailError(this.therapistDetails.email_id)
  if(mailError){
    errors.email_id = mailError
  }
  var phoneError = phoneNumberError(this.therapistDetails.phone_number)
  if(phoneError){
    errors.phone_number = phoneError
  }
  if(!this.profileForm.set(errors)){
    return
  }
  this.therapistDetails.specializations = []
  this.specializationList.forEach((spec : any) => {
    this.therapistDetails.specializations.push(SpecializationMapping[spec])
  });
  this.serviceManager.CallBackendServiceAPI('therapist/edit-details', this.therapistDetails, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
    if(data){
      this.editStatus = false
      localStorage.setItem("timezone", this.therapistDetails.timezone)
      // Cancel on a later edit should go back to what was just saved, not to the first load.
      this.therapistDetailsCopy = JSON.parse(JSON.stringify(this.therapistDetails))
    }
  }, (error: any) =>{
    console.log(error)
  })
}
}
