import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpMethod } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';
import { ServiceManagerService } from '../service-manager.service';
import { TherapistAddActivityService } from './therapist-add-activity.service';
import {Location} from '@angular/common';
import { FieldErrors, FormErrors, isBlank } from 'src/components/form-errors';
@Component({
  selector: 'app-therapist-add-activity',
  templateUrl: './therapist-add-activity.component.html',
  styleUrls: ['./therapist-add-activity.component.css']
})
export class TherapistAddActivityComponent implements OnInit {
  clientIdMapping: any = ""
  urlList: any = []
  currentIndex: any = 0;
  clientId: any = ""
  urlName: any = ""
  form = new FormErrors();
  clientDetails: any = {}
  sessionStartDate: any = ""
  sessionEndDate: any = ""
  currentUrl: any = ""
  activityList: any = []
  selectedDeadline: any;
  isEdit= false;
  activityTypeList: any = [
    {
      "id" : 1,
      "name": "Others"
    },
    {
      "id": 2,
      "name": "PHQ 9"
    },
    {
      "id": 3,
      "name": "GAD 7"
    },
    {
      "id": 4,
      "name": "Self-Monitoring Log"
    },
    {
      "id": 5,
      "name": "Cognitive Exercise"
    },
    {
      "id": 6,
      "name": "Behavioral Activation"
    },
    {
      "id": 7,
      "name": "Skills Practice"
    },
    {
      "id": 8,
      "name": "Behavioral Experiment"
    },
    {
      "id": 9,
      "name": "Problem-Solving"
    },
    {
      "id": 10,
      "name": "Interpersonal Exercise"
    },
    {
      "id": 11,
      "name": "Psychoeducation"
    }
  ]
  activityHistory: any = [];
  currentSessionMaxDate: any = new Date()
  @ViewChild("description") descriptionInput: ElementRef|undefined;
  constructor(private route: ActivatedRoute, public serviceManager: ServiceManagerService, public activityForm: TherapistAddActivityService, private router: Router, public location: Location) {
    this.resetForm()
    this.route.queryParams
      .subscribe(async (params: any) => {
        if(params.id){
          this.clientIdMapping = params.id
          this.getActivityHistory()
        }
      }
    );
   }

  ngOnInit(): void {}

  resetForm(){
    this.selectedDeadline = "session"
    this.activityForm.activity_name = ""
    this.activityForm.activity_description = ""
    this.activityForm.activity_type_id =1
    this.activityForm.city=""
    this.activityForm.therapist_id=""
    this.activityForm.activity_recurrence_type_id=5
    this.activityForm.activity_recurrence=null
    this.activityForm.activity_cluster_id=""
    this.activityForm.activity_deadline=""
    this.activityForm.activity_url=""
    this.activityForm.activity_started_on=""
    this.activityForm.activity_ended_on=""
    this.deadlinePicked = null
}

editUrl(i: any){
  if(this.currentUrl && this.urlName){
    this.addUrl()
  }
  var url = this.urlList[i].split("~")
  this.urlName = url[0]
  this.currentUrl = url[1]
  this.urlList.splice(i, 1);
}

getActivityHistory(){
  var body = {
    "client_therapist_mapping_id": this.clientIdMapping
  }
  const customOptions : HttpCustomOptions = {
    showErrorMessage: true,
    showSuccessMessage: false,
    createLoaderAction: false
  }
  this.serviceManager.CallBackendServiceAPI('therapist/get-activity-history', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
    if(data){
      var response = data.data
      this.activityHistory = response
    }
  }, (error: any) =>{
    console.log(error)
  })
}

  addUrl(){
    const errors: FieldErrors = {}
    if(isBlank(this.urlName)){
      errors.url_text = "Enter the text to show for this link."
    }
    if(isBlank(this.currentUrl)){
      errors.url = "Enter the URL."
    }
    else if(this.currentUrl.includes("~")){
      errors.url = "The URL can't contain \"~\"."
    }
    if(!this.form.set(errors)){
      return
    }
    this.urlList.push([ this.urlName, this.currentUrl].join("~"))
    this.currentUrl = ""
    this.urlName = ""
  }
  setRecurrence(type: any){
    this.activityForm.activity_recurrence_type_id = type
  }
  addActivities(){
    if(!this.activityList.length){
      this.serviceManager.showMessage("Please add atleast one activity to finish")
      return
    }
    const sessionErrors: FieldErrors = {}
    if(!this.sessionStartDate){
      sessionErrors.session_start = "Choose the current session date."
    }
    if(!this.sessionEndDate){
      sessionErrors.session_end = "Choose the next session date."
    }
    if(!this.form.set(sessionErrors)){
      return
    }
    this.addSession().then((session: any)=>{

      var body: any = {}
      body['client_therapist_mapping_id'] = this.clientIdMapping
      body['activities'] = this.activityList

      body['activities'].forEach((activity: any) => {
        activity['activity_deadline'] = this.serviceManager.getFormattedDate(activity['activity_deadline'])
        activity['activity_cluster_id'] = session['activity_cluster_id']
        activity['activity_started_on'] = null
        activity['activity_ended_on'] = null    
      });
      const customOptions : HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: false,
        createLoaderAction: true
      }
      this.serviceManager.CallBackendServiceAPI('therapist/add-activities', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
        if(data){
          this.serviceManager.navigateToPage('/clients')
        }
      }, (error: any) =>{
        console.log(error)
      })
    })
    
  }

  selectNextSession(){
    this.activityForm.activity_deadline = ""
  }
  addSession(){
    return new Promise((resolve, reject)=>{
      var body = {
        "client_therapist_mapping_id": this.clientIdMapping,
        "session_start_date": this.serviceManager.getFormattedDate(this.sessionStartDate),
        "session_end_date": this.serviceManager.getFormattedDate(this.sessionEndDate)|| null
      }
      const customOptions : HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: false,
        createLoaderAction: true
      }
      this.serviceManager.CallBackendServiceAPI('therapist/create-session', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
        if(data){
          var response = data.data
          resolve(response[0])
        }
      }, (error: any) =>{
        console.log(error)
        reject(error)
      })
    })
  }

  removeUrl(url: any){
    const index = this.urlList.indexOf(url);

    if (index >= 0) {
      this.urlList.splice(index, 1);
    }
  }

  appendActivities(){
    const errors = this.activityErrors()
    if(isBlank(this.urlName) != isBlank(this.currentUrl)){
      if(isBlank(this.urlName)){
        errors.url_text = "Enter the text to show for this link, or clear the URL."
      }
      else{
        errors.url = "Enter the URL, or clear the text."
      }
    }
    if(!this.form.set(errors)){
      if(errors.session_start && !this.showsSessionFields()){
        this.serviceManager.showMessage(errors.session_start)
      }
      return
    }
    if(!isBlank(this.urlName) && !isBlank(this.currentUrl)){
      this.addUrl()
    }
    this.activityForm.activity_url = this.urlList.join('|')
    if(this.isEdit){
      this.activityList.splice(this.currentIndex, 0, JSON.parse(JSON.stringify(this.activityForm)))
    }
    else{
      this.activityList.push(JSON.parse(JSON.stringify(this.activityForm)))
    }
    this.descriptionInput?.nativeElement.setAttribute("style", '')
    this.resetForm()
    this.isEdit = false
    this.urlList = []
  }

  get bucketCount(): number {
    return this.activityList.length
  }

  getActivityType(type: any){
    return this.activityTypeList.filter((act: any)=> act.id == type)[0]['name']
  }

  removeActivity(index: any){
    this.activityList.splice(index, 1);
  }


  getActivityInfo(activity: any){
    this.activityForm.activity_description = activity.activity_description
    this.activityForm.activity_name = activity.activity_name
    this.activityForm.activity_type_id = activity.activity_type_id
    this.urlList = activity.activity_url ? activity.activity_url.split('|'): []
    this.syncDeadlinePicker()
  }

  editActivity(index: any){
    this.isEdit = true
    this.currentIndex = index
    this.selectedDeadline = "deadline"
    this.activityForm = JSON.parse(JSON.stringify(this.activityList[index]))
    this.removeActivity(index)
    this.urlList = this.activityForm.activity_url? this.activityForm.activity_url.split('|'): []
    this.syncDeadlinePicker()
  }

  formatDate(date: any){
    return this.serviceManager.formatDisplayDate(date)
  }
  /**
   * Field errors for the activity form, keyed by field. Once the form is valid
   * it also fills in the defaults (deadline = next session, recurrence = 1).
   */
  activityErrors(): FieldErrors {
    const errors: FieldErrors = {}
    var currentSession: any = new Date(this.sessionStartDate)
    if(isBlank(this.activityForm.activity_name)){
      errors.activity_name = "Enter an activity name."
    }
    if(!this.activityForm.activity_type_id){
      errors.activity_type = "Choose an activity type."
    }
    if(!this.sessionStartDate){
      errors.session_start = "Choose the current session date."
    }
    else if(currentSession == 'Invalid Date'){
      errors.session_start = "Enter a valid current session date."
    }
    else if(this.serviceManager.getFormattedDate(currentSession) > this.serviceManager.getFormattedDate(this.currentSessionMaxDate)){
      errors.session_start = "The current session can't be later than today."
    }
    if(!this.activityForm.activity_deadline){
      if(this.selectedDeadline == "deadline"){
        errors.deadline = "Pick a deadline date."
      }
      else if(!this.sessionEndDate){
        errors.deadline = "Pick a deadline date or choose Next session."
      }
    }
    // "Every N days/weeks/months": N must be a whole number. Blank means 1.
    // The box is a text field, so what was typed reaches this check as is.
    var count = String(this.activityForm.activity_recurrence ?? '').trim()
    if([2, 3, 4].includes(Number(this.activityForm.activity_recurrence_type_id)) && count
      && !(/^\d+$/.test(count) && Number(count) >= 1 && Number(count) <= 365)){
      errors.recurrence = "Enter a whole number from 1 to 365."
    }
    if(Object.keys(errors).length){
      return errors
    }
    if(!this.activityForm.activity_deadline){
      this.activityForm.activity_deadline = this.sessionEndDate
    }
    if(this.activityForm.activity_recurrence_type_id != 1 && !this.activityForm.activity_recurrence){
      this.activityForm.activity_recurrence = 1
    }
    else if(this.activityForm.activity_recurrence){
      this.activityForm.activity_recurrence = Number(this.activityForm.activity_recurrence)
    }
    return errors
  }

  /** Units for "Every N ..." recurrence (recurrence type ids). */
  recurrenceUnits = [{ label: 'days', value: 2 }, { label: 'weeks', value: 3 }, { label: 'months', value: 4 }]

  /** Recurrence radio: 5 = one time, 1 = every day, 0 = every N days/weeks/months. */
  get recurrenceMode(): number {
    var type = Number(this.activityForm.activity_recurrence_type_id)
    return type == 1 || type == 5 ? type : 0
  }

  set recurrenceMode(mode: number) {
    this.setRecurrence(mode == 0 ? this.recurrenceUnit : mode)
  }

  get recurrenceUnit(): number {
    var type = Number(this.activityForm.activity_recurrence_type_id)
    return [2, 3, 4].includes(type) ? type : 2
  }

  set recurrenceUnit(unit: number) {
    this.setRecurrence(unit)
  }

  /** "One time", "Every day" or "Every 3 weeks", for the bucket. */
  recurrenceLabel(activity: any): string {
    var type = Number(activity.activity_recurrence_type_id)
    if(type == 5){
      return 'One time'
    }
    if(type == 1){
      return 'Every day'
    }
    var count = Number(activity.activity_recurrence) || 1
    var unit = this.recurrenceUnits.find(u => u.value == type)?.label || 'days'
    // "Every day", "Every week", or "Every 3 weeks".
    return count == 1 ? `Every ${unit.replace(/s$/, '')}` : `Every ${count} ${unit}`
  }

  /** The deadline picker's value. activity_deadline can hold a Date or a date string. */
  deadlinePicked: Date | null = null

  syncDeadlinePicker(){
    this.deadlinePicked = this.toLocalDate(this.activityForm.activity_deadline)
  }

  onDeadlinePicked(date: Date){
    this.activityForm.activity_deadline = date
    this.form.clear('deadline')
  }

  onDeadlineModeChange(){
    this.form.clear('deadline')
    if(this.selectedDeadline == 'session'){
      this.selectNextSession()
      this.deadlinePicked = null
    }
  }

  /** Date-only strings ("2026-10-17") are local dates; anything else is parsed as an instant. */
  private toLocalDate(value: any): Date | null {
    if(!value){
      return null
    }
    if(value instanceof Date){
      return value
    }
    var match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:$|\s)/)
    if(match){
      return new Date(+match[1], +match[2] - 1, +match[3])
    }
    var date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }

  /** Whether this screen shows the current/next session date fields. */
  showsSessionFields(){
    return true
  }

  /** The first activity-form error, or "" when the form is valid. */
  isValidForm(){
    const errors = this.activityErrors()
    return errors[Object.keys(errors)[0]] || ""
  }
}
