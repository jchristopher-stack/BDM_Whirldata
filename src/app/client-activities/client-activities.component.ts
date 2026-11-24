import { Component, OnInit } from '@angular/core';
import { HttpMethod } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';
import { ServiceManagerService } from '../service-manager.service';
import {Location} from '@angular/common';
import { Router } from '@angular/router';
import { PageTitleService } from '../page-title.service';
import * as moment from 'moment';
import 'moment-timezone';

/** Comments that share a calendar day (therapist's timezone). */
interface CommentDay {
  date: string
  items: any[]
}
@Component({
  selector: 'app-client-activities',
  templateUrl: './client-activities.component.html',
  styleUrls: ['./client-activities.component.css']
})
export class ClientActivitiesComponent implements OnInit {

  currentActivity: any = []
  currentSession: any = ""
  currentActivityIndex: any = 0
  clientId: any = ""
  clientDetails: any = {}
  activityDetails: any = []
  activityList: any = []
  progressCommentList: any = []
  progressComments: any ={}
  graphDatasetCopy: any = []
  graphDataset: any = []
  currentGraph: any = 1
  progressSelectedImg: any = "GREAT"
  moodOptions = [
    { label: 'Great', value: 'GREAT', icon: 'assets/img/happy.png' },
    { label: 'Did the job', value: 'GOOD', icon: 'assets/img/neutral.png' },
    { label: "Didn't feel good", value: 'BAD', icon: 'assets/img/sad.png' },
  ]
  /** progressComments for the selected mood, as day groups in the current sort order. */
  commentDays: CommentDay[] = []

  lineChartColor : any =[{
    "name": "GREAT",
    "value": "#9CD1E3"
  },
  {
    "name": "GOOD",
    "value": "#FEB583"
  },
  {
    "name": "BAD",
    "value": "#EE9680"
  }]
  Object = Object;
  isDescending: boolean = true;
  /** The current activity's details and graph have loaded (shows a skeleton until then). */
  infoLoaded: boolean = false;
  showDeleteDialog: boolean = false;
  constructor(public serviceManager: ServiceManagerService, public location: Location, private router: Router, private pageTitle: PageTitleService) { 
    this.currentActivity = localStorage.getItem('currentActivity')
    this.currentSession = localStorage.getItem('currentSession')
    this.clientId = localStorage.getItem('client')
    this.getActivityInfo()
    this.getActivities()
    this.getClientDetails()
  }
  ngOnInit(): void {
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

  toggleDeleteModal(){
    this.showDeleteDialog = !this.showDeleteDialog;
  }

  deleteActivity(){
    this.showDeleteDialog = false
      var body = {
        "activity_id": this.activityDetails.activity_id,
      }
      const customOptions : HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: false,
        createLoaderAction: true
      }
      this.serviceManager.CallBackendServiceAPI('therapist/delete-activity', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
        if(data){
          this.location.back()
        }
      }, (error: any) =>{
        console.log(error)
      })

  }

  sortByTime(isDesc: any){
    this.isDescending = Boolean(isDesc)
    this.progressCommentSort(this.isDescending)
    this.groupComments()
  }

  /** Rebuilds progressComments (all comments by day) and commentDays (the selected mood only). */
  groupComments(){
    this.progressComments = {}
    this.progressCommentList.forEach((comment: any) => {
      if(!comment.activity_feedback_text || !comment.activity_feedback_text.trim()){
        return
      }
      var day = comment.local.format("ddd, D MMM YYYY")
      if(!this.progressComments[day]){
        this.progressComments[day] = []
      }
      this.progressComments[day].push(comment)
    })
    this.commentDays = Object.keys(this.progressComments)
      .map((date: string) => ({ date, items: this.progressComments[date].filter((comment: any) => comment.feedback == this.progressSelectedImg) }))
      .filter((day: CommentDay) => day.items.length)
  }

  /** How many written comments carry this mood rating. */
  moodCount(mood: string): number {
    return Object.values(this.progressComments).reduce((total: number, comments: any) =>
      total + comments.filter((comment: any) => comment.feedback == mood).length, 0) as number
  }

  get commentCount(): number {
    return Object.values(this.progressComments).reduce((total: number, comments: any) => total + comments.length, 0) as number
  }

  /** "IN-PROGRESS" as "In progress". */
  statusLabel(): string {
    var status = String(this.activityDetails.activity_status || "").replace(/[-_]+/g, " ").toLowerCase()
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  /** Whole-number y-axis ticks (counts), 0 up to the tallest bar on the current page. Set by showGraphPage. */
  yTicks: number[] = [0, 1]
  /** Counts are whole numbers; ngx-charts would print "1.0". */
  readonly formatCount = (value: number) => String(Math.round(value))

  private countTicks(): number[] {
    var max = 0
    this.graphDataset.forEach((day: any) => day.series.forEach((bar: any) => max = Math.max(max, bar.value)))
    var step = Math.max(1, Math.ceil(max / 5))
    var ticks = []
    for(var tick = 0; tick <= Math.max(max, 1); tick += step){
      ticks.push(tick)
    }
    return ticks
  }

  moodLabel(mood: string): string {
    return this.moodOptions.find(option => option.value == mood)?.label || ''
  }

  /** "Every day", "Every 2 weeks", "One time"... from the backend's recurrence_type name. */
  recurrenceLabel(): string {
    var count = Number(this.activityDetails.recurrence) || 1
    var unit = (name: string) => count == 1 ? `Every ${name}` : `Every ${count} ${name}s`
    switch(this.activityDetails.recurrence_type){
      case 'EVERYDAY': return 'Every day'
      case 'EVERY X DAYS': return unit('day')
      case 'EVERY X WEEKS': return unit('week')
      case 'EVERY X MONTHS': return unit('month')
      case 'ONE-TIME': return 'One time'
      default: return this.activityDetails.recurrence_type || ''
    }
  }

  /** activity_url is "Text~url|Text~url"; empty parts are skipped and bare domains get https://. */
  get links(): { name: string, url: string }[] {
    return String(this.activityDetails.activity_url || "").split("|")
      .map((part: string) => part.split("~"))
      .filter((pair: string[]) => pair[1] && pair[1].trim())
      .map((pair: string[]) => {
        var url = pair[1].trim()
        return { name: (pair[0] || url).trim(), url: /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}` }
      })
  }

  /** The backend's UTC date + time in the therapist's timezone (same rule as ServiceManager.showTime). */
  private toLocal(timestamp: string): moment.Moment {
    var timezone: any = localStorage.getItem("timezone")
    var utc = timestamp.indexOf('Z') == -1 ? timestamp + 'Z' : timestamp
    return timezone ? moment.tz(utc, timezone) : moment(utc)
  }

  getActivityInfo(){
    this.infoLoaded = false
    this.currentGraph = 1
    // Reset, or comments from the previously viewed activity stay on screen.
    this.progressComments = {}
    this.commentDays = []
    var body = {
      "activity_id":  this.currentActivity
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: false,
      createLoaderAction: false
    }
    this.serviceManager.CallBackendServiceAPI('therapist/get-activity-info', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        var response = data.data[0]
        this.activityDetails = response
        this.pageTitle.set(response.activity_name)
        this.progressCommentList = response['comments']
        this.progressCommentList.forEach((comment: any) => {
          comment.local = this.toLocal([comment.date, comment.timestamp].join(" "))
          comment.time = comment.local.format("HH:mm")
        })
        this.progressCommentSort(this.isDescending)
        this.groupComments()
        // Open on a mood that has comments, so the panel isn't empty when there's something to read.
        if(!this.moodCount(this.progressSelectedImg)){
          var withComments = this.moodOptions.find(option => this.moodCount(option.value))
          if(withComments){
            this.progressSelectedImg = withComments.value
            this.groupComments()
          }
        }
        this.setGraphData(this.progressCommentList)
      }
      this.infoLoaded = true
        }, (error: any) =>{
      console.log(error)
      this.infoLoaded = true
    }) 
  }

  /**
   * Moves between pages of 5 days. Page 1 is the most recent; flow -1 goes to earlier days, 1 to later.
   */
  graphNavigate(flow: any){
    var page = Math.min(Math.max(this.currentGraph - flow, 1), this.showGraphPageCount())
    this.showGraphPage(page)
  }

  private showGraphPage(page: number){
    this.currentGraph = page
    var end = this.graphDatasetCopy.length - 5 * (page - 1)
    this.graphDataset = this.graphDatasetCopy.slice(Math.max(0, end - 5), end)
    this.yTicks = this.countTicks()
  }

  /** First and last day on the current chart page, e.g. "9 Oct 2026 – 13 Oct 2026". */
  get graphRange(): string {
    if(!this.graphDataset.length){
      return ""
    }
    var first = this.graphDataset[0].name
    var last = this.graphDataset[this.graphDataset.length - 1].name
    return first == last ? first : `${first} – ${last}`
  }
  setGraphData(data: any){
    var countsByDate: any = {}
    this.graphDataset = []
    this.graphDatasetCopy = []
    // Counted from the responses on the therapist's calendar, oldest day first. The
    // backend's graph groups by UTC date, which put evening responses on the next day
    // (and so on a different day from the same response in the comments).
    data.filter((response: any) => response.feedback)
      .sort((a: any, b: any) => a.local.valueOf() - b.local.valueOf())
      .forEach((response: any) => {
        var date = response.local.format("DD MMM YYYY")
        if(!countsByDate[date]){
          countsByDate[date] = {}
        }
        countsByDate[date][response.feedback] = (countsByDate[date][response.feedback] || 0) + 1
      });

    // ngx-charts places bars in the order it first sees each name, so every date
    // must list them in the same fixed order as the legend. Pushing the actual
    // counts first put a lone GOOD bar in the "It was great!" slot (sheet #30).
    for(var date in countsByDate){
      var series = ["GREAT", "GOOD", "BAD"].map((name: any) => ({"name": name, "value": countsByDate[date][name] || 0}))
      this.graphDatasetCopy.push({ "name": date, "series": series})
    }
    this.showGraphPage(1)
  }

  progressCommentSort(isDescending: any){
    if(isDescending)
      this.progressCommentList = this.progressCommentList.sort((a : any, b : any) => ([a.date,a.timestamp].join(" ") > [b.date,b.timestamp].join(" ") ) ? -1 : 1);
    else 
      this.progressCommentList = this.progressCommentList.sort((a : any, b : any) => ([a.date,a.timestamp].join(" ") < [b.date,b.timestamp].join(" ") ) ? -1 : 1);
  }


  getActivities(){
    var body = {
      "session_id": this.currentSession
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: false,
      createLoaderAction: false
    }
    this.serviceManager.CallBackendServiceAPI('therapist/get-activities', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        var response = data.data
        response.forEach((activity: any) => {
          if(activity.activity_type_id == 1){
            if (activity.activity_id == this.currentActivity)
              this.currentActivityIndex = this.activityList.length
            this.activityList.push(activity)
        }});
      }
    }, (error: any) =>{
      console.log(error)
    })
  }

  /**
   * Navigate to specific activity based on navigation action.
   * @param increment
   */
  navToActivity(increment: any): void{
    this.currentActivityIndex = this.currentActivityIndex + increment
    this.currentActivity = this.activityList[this.currentActivityIndex].activity_id
    this.getActivityInfo()
  }

  /**
   * Navigate to edit activity page with activity id.
   */
  navToEditActivity(): void{
    this.serviceManager.navigateToPage('/client/edit-activity', {
      activity_id : this.activityDetails.activity_id
    })
  }

  /**
   * Shows graph page count based on the graph data
   * @returns graph page count 
   */
  showGraphPageCount(): number{
    // Was len/5 + 1, which showed an empty extra page whenever the days were a multiple of 5.
    return Math.ceil(this.graphDatasetCopy.length / 5)
  }

}

