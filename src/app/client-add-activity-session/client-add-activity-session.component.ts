import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpMethod } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';
import { ServiceManagerService } from '../service-manager.service';
import { ClientAddActivitySessionService } from './client-add-activity-session.service';
import {Location} from '@angular/common';
import { FieldErrors, FormErrors, isBlank } from 'src/components/form-errors';
import * as moment from 'moment';

@Component({
  selector: 'app-client-add-activity-session',
  templateUrl: './client-add-activity-session.component.html',
  styleUrls: ['./client-add-activity-session.component.css']
})
export class ClientAddActivitySessionComponent implements OnInit {

  urlList: any = []
  clientId: any = ""
  isAddSession: any = false
  clientDetails: any = {}
  currentUrl: any = ""
  urlName: any = ""
  form = new FormErrors();
  editActivities: boolean = false;
  editActivityId: any = ""
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
  sessionStartDate: any = ""
  sessionEndDate: any = ""
  activityList: any = []
  existingLength: any = 0;
  clientIdMapping: any = ""
  isEdit: any =false
  currentIndex: any = 0;
  currentSession: any = 0;
  activityHistory: any = [];
  selectedDeadline: any;
  currentSessionMaxDate: any = new Date()
  @ViewChild("description") descriptionInput: ElementRef|undefined;
  showConfirmation: boolean = false;
  /** Asks before saving a new session with nothing in the bucket. */
  showSkipActivities: boolean = false;
  /** The client's existing activities have loaded into the bucket (skeleton until then). */
  bucketLoaded: boolean = false;
  constructor(public serviceManager: ServiceManagerService, private route: ActivatedRoute, public activityForm: ClientAddActivitySessionService, public location: Location, public router: Router) {
    this.resetForm()
    this.isAddSession =  Boolean(router.url.match('add-session'))
   }

  ngOnInit(): void {
    this.editActivities = false
    this.route.queryParams
      .subscribe(async (params: any) => {
        if(params.id){
          this.clientId = params.id
          await this.getClientDetails()
          this.prefillCurrentSession()
          this.getActivityHistory()
        }
        if(params.session){
          await this.getSession(params.session)
        }
        else{
          this.bucketLoaded = true
        }
        if(params.activity_id){
          this.editActivityId = params.activity_id
          this.editActivities = true
          this.selectedDeadline = "deadline"
          this.getActivityInfo(params, true)
        }
      }
    );
  }

  /**
   * New session for a client who already has one: the current session is the
   * one that session booked as "next", so start from that date. If that date is
   * still ahead (or wasn't set), use today, as the current session can't be later
   * than today. The therapist can still change it.
   */
  prefillCurrentSession(){
    if(!this.isAddSession || this.sessionStartDate || !this.clientDetails?.last_session){
      return
    }
    // Same "today" as the picker's max date, so the prefill is always allowed.
    var today = moment(this.currentSessionMaxDate).startOf('day')
    var booked = moment(String(this.clientDetails.next_session || '').split(' ')[0], 'YYYY-MM-DD', true)
    this.sessionStartDate = (booked.isValid() && !booked.isAfter(today) ? booked : today).toDate()
  }

  getActivityInfo(activity: any, needData: any){

    if(!needData){
      this.activityForm.activity_description = activity.activity_description
      this.activityForm.activity_name = activity.activity_name
      this.activityForm.activity_type_id = activity.activity_type_id
      this.urlList = activity.activity_url ? activity.activity_url.split('|'): []
      return
    }
    var body = {
      "activity_id":  activity.activity_id
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: false,
      createLoaderAction: false
    }
    this.serviceManager.CallBackendServiceAPI('therapist/get-activity-info', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        var response = data.data[0]
        this.activityForm.activity_deadline =new Date(response.activity_deadline).toISOString()
        this.activityForm.activity_description = response.activity_description
        this.activityForm.activity_name = response.activity_name
        this.activityForm.activity_type_id = response.activity_type_id
        this.urlList = response.activity_url?response.activity_url.split('|'): []
        var recurrence = this.setRecurrenceType(response)
        this.activityForm.activity_recurrence_type_id = recurrence[0]
        this.activityForm.activity_recurrence = recurrence[1]
        this.syncDeadlinePicker()
        }}, (error: any) =>{
      console.log(error)
    }) 
  }

  formatDate(date: any){
    return this.serviceManager.formatDisplayDate(date)
  }
  
  setRecurrenceType(response: any){
    var recurrenceList  = ["EVERYDAY", "EVERY X DAYS", "EVERY X WEEKS", "EVERY X MONTHS", "ONE-TIME"]
    var typeId= recurrenceList.indexOf(response.activity_recurrence) + 1
    return [typeId, [1, 5].includes(typeId)? null : response.recurrence]
  }
  selectNextSession(){
    this.activityForm.activity_deadline = ""
  }
  resetForm(){
    this.selectedDeadline = "session"
    this.activityForm.activity_name = ""
    this.activityForm.activity_description = ""
    this.activityForm.activity_type_id =""
    this.activityForm.city=""
    this.activityForm.therapist_id=""
    this.activityForm.activity_recurrence_type_id=5
    this.activityForm.activity_recurrence=null
    this.activityForm.activity_cluster_id=""
    this.activityForm.activity_deadline=""
    this.activityForm.activity_url=""
    this.activityForm.activity_started_on=""
    this.activityForm.activity_ended_on=""
    this.activityForm.isExisting = false
    this.deadlinePicked = null
  }

  getSession(session: any){
    var therapistId = localStorage.getItem("therapist_id")
      var body = {
        "session_id": session
      }
      const customOptions : HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: false,
        createLoaderAction: false
      }
      this.serviceManager.CallBackendServiceAPI('therapist/get-session', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
        if(data){
          var response = data.data
          this.currentSession = response[0]
          this.sessionStartDate = this.currentSession['session_start_date']
          this.sessionEndDate = this.currentSession['session_end_date']
          this.getActivities()
        }
      }, (error: any) =>{
        console.log(error)
        this.bucketLoaded = true
      })
  }

  getActivityHistory(){
      var body = {
        "client_therapist_mapping_id": this.clientDetails.client_therapist_mapping_id
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

  addSession(){
    return new Promise((resolve, reject)=>{
      var body = {
        "client_therapist_mapping_id": this.clientDetails.client_therapist_mapping_id,
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

  async setUpdateActivity(){
    var body = {
      "activity_id": this.editActivityId,
      "activity_name": this.activityForm.activity_name,
      "activity_description": this.activityForm.activity_description,
      "activity_url": this.urlList.join('|'),
      "activity_deadline": this.serviceManager.getFormattedDate(this.activityForm.activity_deadline),
      "activity_recurrence_type_id": this.activityForm.activity_recurrence_type_id,
      "activity_recurrence": this.activityForm.activity_recurrence
    }
    await this.updateActivity(body)
    this.location.back()
  }
  updateActivity(body: any){
    return new Promise((resolve)=>{
      const customOptions : HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: true,
        createLoaderAction: true
      }
      this.serviceManager.CallBackendServiceAPI('therapist/edit-activity', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
        if(data){
          var response = data.data
          resolve(true)
        }
      }, (error: any) =>{
        console.log(error)
      })
    })
  }

  disableShareActivity(){
    // A new session can be saved with an empty bucket; activities can follow later.
    // It just needs the client's details, which hold the mapping it's saved for.
    if(this.isAddSession){
      return !this.clientDetails?.client_therapist_mapping_id
    }
    var currentActivity = this.activityList.filter((e: any) => !e?.isExisting)
    var existingActivity = this.activityList.filter((e: any) => e?.isExisting && e.action)

    if(!currentActivity.length && !existingActivity.length){
      return true
    }
    return false
  }
  deleteActivity(activityId: any){
      var body = {
        "activity_id": activityId,
      }
      const customOptions : HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: false,
        createLoaderAction: true
      }
      this.serviceManager.CallBackendServiceAPI('therapist/delete-activity', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      }, (error: any) =>{
        console.log(error)
      })
  }
  /**
   * Shares the bucket. On a new session this also creates the session, and
   * skipActivities saves it with an empty bucket (after the therapist confirms).
   */
  async addActivities(skipActivities: boolean = false){
    var session: any ={};
    var currentActivity = this.activityList.filter((e: any) => !e?.isExisting)
    var existingActivity = this.activityList.filter((e: any) => e?.isExisting && e.action)
    if(!this.isValidForm()){
      this.showConfirmation = true
      return
    }
    if(!currentActivity.length && !existingActivity.length && !this.isAddSession){
      return
    }
    if(this.isAddSession){
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
      if(!currentActivity.length && !skipActivities){
        this.showSkipActivities = true
        return
      }
      session = await this.addSession()
    }
    else{
      session['activity_cluster_id'] = this.currentSession['activity_cluster_id']
    }

    if(existingActivity){
      existingActivity.forEach(async (e: any) => {
        if(e.action == "UPDATE"){
          var body = {
            "activity_id": e.activity_id,
            "activity_name": e.activity_name,
            "activity_description": e.activity_description,
            "activity_url": e.activity_url,
            "activity_deadline": e.activity_deadline,
            "activity_recurrence_type_id": e.activity_recurrence_type_id,
            "activity_recurrence": e.activity_recurrence
          }
          await this.updateActivity(body)
        }
        else{
          this.deleteActivity(e.activity_id)
        }
      })
    }
    if(!currentActivity.length){
      this.location.back()
      return
    }
    var body: any = {}
    body['client_therapist_mapping_id'] = this.clientDetails.client_therapist_mapping_id
    body['activities'] = currentActivity

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
        var response = data.data
        this.location.back()
      }
    }, (error: any) =>{
      console.log(error)
    })
    
  }

  /** Activities in the bucket, not counting ones marked for removal. */
  get bucketCount(): number {
    return this.activityList.filter((activity: any) => activity?.action != 'DELETE').length
  }

  showDate(date: any){
    return this.serviceManager.formatDisplayDate(date)
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
      this.activityList.splice(-this.existingLength, 0, JSON.parse(JSON.stringify(this.activityForm)))
    }
    if(this.activityForm.isExisting){
      this.activityList[this.currentIndex]["action"] = "UPDATE"
    }
    this.descriptionInput?.nativeElement.setAttribute("style", '')
    this.resetForm()
    this.isEdit = false
    this.urlList = []
  }

  getActivities(){
    var body = {
      "session_id": this.currentSession.session_id
  }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: false,
      createLoaderAction: false
    }
    this.serviceManager.CallBackendServiceAPI('therapist/get-activities', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        var response = data.data
        response.forEach((e:any)=>{
          e.isExisting = true
          var recurrence = this.setRecurrenceType(e)
          e.activity_deadline = e.activity_deadline.split(" ")[0]
          e.activity_recurrence_type_id = recurrence[0]
          e.activity_recurrence = recurrence[1]
          e.action = null
        })
        this.activityList = response
        this.existingLength = response.length
      }
      this.bucketLoaded = true
    }, (error: any) =>{
      console.log(error)
      this.bucketLoaded = true
    })

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
          this.clientDetails = response[0]
          resolve(true)
        }
      }, (error: any) =>{
        console.log(error)
        reject(false)
      })
    })
  }

  getActivityType(type: any){
    return this.activityTypeList.filter((act: any)=> act.id == type)[0]['name']
  }

  setRecurrence(type: any){
    this.activityForm.activity_recurrence_type_id = type
  }

  editUrl(i: any){
    if(this.currentUrl && this.urlName){
      this.addUrl()
    }
    var url = this.urlList[i].split("~")
    this.currentUrl = url[1]
    this.urlName = url[0]
    this.urlList.splice(i, 1);
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
    this.urlList.push([this.urlName, this.currentUrl].join("~"))
    this.currentUrl = ""
    this.urlName = ""
  }
  removeUrl(url: any){
    const index = this.urlList.indexOf(url);

    if (index >= 0) {
      this.urlList.splice(index, 1);
    }
  }

  removeActivity(index: any, isEdit: any = false){
    if(this.activityList[index]["isExisting"] && !isEdit){
      this.activityList[index]["action"] = "DELETE"
    }
    else
      this.activityList.splice(index, 1);
  }

  editActivity(index: any){
    this.currentIndex = index
    if(!this.isValidForm()){
      this.showConfirmation = true
    }
    else{
      this.isEdit = true
      this.selectedDeadline = "deadline"
      if(this.activityForm.isExisting){
        this.appendActivities()
      }
      this.activityForm = JSON.parse(JSON.stringify(this.activityList[index]))
      this.removeActivity(index, true)
      this.urlList = this.activityForm.activity_url? this.activityForm.activity_url.split('|') : []
      this.syncDeadlinePicker()
    }
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
      this.activityForm.activity_deadline = this.serviceManager.getFormattedDate(this.sessionEndDate)
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
    return this.isAddSession && !this.editActivities
  }

  /** The first activity-form error, or "" when the form is valid. */
  isValidForm(){
    const errors = this.activityErrors()
    return errors[Object.keys(errors)[0]] || ""
  }

  cancelShareActivity(){
    if(this.isValidForm()){
      this.location.back()
    }
    else{
      this.showConfirmation = true
    }
  }
}
