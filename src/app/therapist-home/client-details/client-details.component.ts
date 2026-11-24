import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceManagerService } from 'src/app/service-manager.service';
import { HttpMethod } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';
import { Clipboard } from '@angular/cdk/clipboard';
import {Location} from '@angular/common';
import * as shape from 'd3-shape';
import * as moment from 'moment';
import 'moment-timezone';
import { MenuItem } from 'primeng/api';
import { PageTitleService } from '../../page-title.service';

// Chat messages are grouped under this label, shown as-is as the day header.
const CHAT_DAY_FORMAT = "DD MMM YYYY";

@Component({
  selector: 'app-client-details',
  templateUrl: './client-details.component.html',
  styleUrls: ['./client-details.component.css']
})
export class ClientDetailsComponent implements OnInit, OnDestroy {

  @ViewChild('chat') private chatContainer: ElementRef;
  clientId: any = ""
  currentType = "Activities";
  viewOptions = [{ label: 'Activities', value: 'Activities' }, { label: 'Progress', value: 'Progress' }]
  /** Right-hand panel: chat with the client, or their activity comments. */
  sidePanel = "Messages"
  panelOptions = [{ label: 'Messages', value: 'Messages' }, { label: 'Comments', value: 'Comments' }]
  commentsLoaded = false
  moodOptions = [
    { label: 'Great', value: 'GREAT', icon: 'assets/img/happy.png' },
    { label: 'Did the job', value: 'GOOD', icon: 'assets/img/neutral.png' },
    { label: "Didn't feel good", value: 'BAD', icon: 'assets/img/sad.png' },
  ]
  moreActions: MenuItem[] = [
    { label: 'Edit session dates', icon: 'pi pi-calendar', command: () => this.toggleSessionModal() },
    { separator: true },
    { label: 'Delete client', icon: 'pi pi-trash', styleClass: 'menu-item-danger', command: () => this.toggleDeleteModal() },
  ]
  clientDetails: any = {};
  sessionList: any = []
  activityObj: any = {}
  selectedStructuredActivity: any = null
  /** The selected structured activity's responses, newest first: { when, rows: [{label, value}] }. */
  structuredResponses: any[] = []
  showStructuredModal: boolean = false
  // Field labels for the structured-response activity types (4-11). Keys match the
  // JSON keys the client app / test_matrix.py write into activity_responses_details.structured_response.
  structuredFieldLabels: any = {
    4: { trigger_context: "Trigger / context", mood_before: "Mood before", intensity_before: "Intensity before",
         what_you_did: "What you did", mood_after: "Mood after", intensity_after: "Intensity after" },
    5: { situation: "Situation", feeling_before: "Feeling before", intensity_before: "Intensity before",
         automatic_thought: "Automatic thought", evidence_for: "Evidence for", evidence_against: "Evidence against",
         alternative_thought: "Alternative thought", feeling_after: "Feeling after", intensity_after: "Intensity after" },
    6: { planned_activity: "Planned activity", planned_time: "Planned time", predicted_difficulty: "Predicted difficulty",
         predicted_mood_after: "Predicted mood after", completed: "Completed?", mood_before: "Mood before",
         mood_after: "Mood after", what_helped_or_interfered: "What helped / interfered" },
    7: { duration_practiced_minutes: "Duration practiced (min)", distress_before: "Distress before",
         distress_after: "Distress after", would_use_again: "Would use again?", notes: "Notes" },
    8: { prediction: "Prediction", safety_behaviors_avoided: "Safety behaviors avoided",
         expected_outcome: "Expected outcome", actual_outcome: "Actual outcome", what_was_learned: "What was learned",
         belief_strength_before: "Belief strength before", belief_strength_after: "Belief strength after" },
    9: { problem_defined: "Problem defined", options_brainstormed: "Options brainstormed",
         solution_selected: "Solution selected", action_plan: "Action plan", outcome_status: "Outcome" },
    10: { skill_practiced: "Skill practiced", situation: "Situation", what_you_said_or_did: "What you said/did",
          how_they_responded: "How they responded", how_you_felt: "How you felt" },
    11: { content_format: "Content", viewed: "Viewed?", comprehension_correct: "Comprehension (correct)",
          comprehension_total: "Comprehension (total)", reflection: "Reflection" },
  }
  structuredActivityTypeNames: any = {
    4: "Self-Monitoring Log", 5: "Cognitive Exercise", 6: "Behavioral Activation", 7: "Skills Practice",
    8: "Behavioral Experiment", 9: "Problem-Solving", 10: "Interpersonal Exercise", 11: "Psychoeducation",
  }
  cognitiveExerciseProgress: any = null
  currentSession: any = {}
  Object = Object;
  curve = shape.curveCardinal.tension(0);
  commentSelectedSession: any = {}
  showDeleteDialog: boolean = false;
  showSessionDialog: boolean = false;
  progressComments: any = {}
  progressCommentList: any = []
  sendStatus: any = false;
  isDescending: any = true
  progressSelectedImg: any = "GREAT"
  progressMessages: any = {
    "GREAT": "It was great!",
    "GOOD": "It did the job",
    "BAD": "It didn't feel good"
  }
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
  phqLineChartColor: any =[{
    "name": "PHQ 9",
    "value": "#fd8430"
  },
  {
    "name":"GAD 7",
    "value": "#5ab3d1"
  }]
  lineChartData: any = [];
  phqLineChart:any = [
    {}
  ]
  messageObj: any = {}
  messageList: any =[]
  latestSession: any = ""
  sendMessageTxt: any = ""
  apiDataLoaded: any = false
  /** First load of the client's details / messages finished (shows skeletons until then). */
  clientLoaded: boolean = false
  messagesLoaded: boolean = false
  sessionStartDate: any = ""
  sessionEndDate: any = ""
  readonly MESSAGE_POLL_MS = 5000
  messagePollTimer: any = null
  messageSignature: string = ""
  constructor(public serviceManager: ServiceManagerService, public route: ActivatedRoute, private location: Location,
    private router: Router, private clipboard: Clipboard, private pageTitle: PageTitleService) {
    this.chatContainer =  {} as ElementRef;
  }

  ngOnInit(): void {
    this.sendStatus = false
    this.apiDataLoaded = false
    this.route.queryParams
      .subscribe(async (params: any) => {
        if(params.id){
          this.clientId = params.id
          localStorage.setItem("client", this.clientId)
          await this.getClientDetails()
          await this.getMessages()
          this.startMessagePolling()
          await this.getAllSessions()
          await this.getActivities()
        }
        else{
          this.location.back()
        }
      }
    );
    
  }

  sortByTime(isDesc: any){
    var sortedJson:any ={}
    var sortedList = Object.keys(this.progressComments).reverse()
    
    sortedList.forEach(( e: any)=> {
      sortedJson[e] = this.progressComments[e]
    })
    this.progressComments = sortedJson
    this.isDescending = isDesc 
  }

  /** Scrolls the chat to the newest message once Angular has rendered it. */
  scrollToBottom(): void {
    setTimeout(() => {
      const chat = this.chatContainer?.nativeElement
      if(chat){
        chat.scrollTop = chat.scrollHeight
      }
    })
  }

  /** How many of this session's comments carry a mood rating (GREAT / GOOD / BAD). */
  moodCount(mood: string): number {
    return Object.values(this.progressComments).reduce((total: number, comments: any) =>
      total + comments.filter((comment: any) => comment.feedback_tag_name == mood).length, 0) as number
  }

  moodLabel(mood: string): string {
    return this.moodOptions.find(option => option.value == mood)?.label || ''
  }

  toggleCommentSort(){
    this.sortByTime(!this.isDescending)
  }

  /** Switches the right-hand panel; comments load the first time they're shown. */
  onPanelChange(){
    if(this.sidePanel == 'Comments' && !this.commentsLoaded){
      this.getAllComments().catch(() => {})
    }
    if(this.sidePanel == 'Messages'){
      this.scrollToBottom()
    }
  }

  toggleDeleteModal(){
    this.showDeleteDialog = !this.showDeleteDialog;
  }
  toggleSessionModal(){
    this.showSessionDialog = !this.showSessionDialog;
  }

  getAllSessions(){
    return new Promise((resolve, reject)=> {
      var body = {
        "client_therapist_mapping_id": this.clientDetails.client_therapist_mapping_id
      }
      const customOptions : HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: false,
        createLoaderAction: false
      }
      this.serviceManager.CallBackendServiceAPI('therapist/get-all-sessions', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
        if(data){
          var response = data.data
          this.sessionList = response
          var sessionLength = response.length
          
          if(!sessionLength){
            resolve(true)
            return
          }
          this.sessionList.forEach((session: any) => {
            session["name"] = "Session " + sessionLength
            sessionLength -= 1
          });
          var activeSession = this.sessionList.filter((e: any)=> e.session_is_active)[0] || this.sessionList[0]
          this.currentSession = activeSession
          this.latestSession = activeSession
          this.commentSelectedSession = activeSession
          this.sessionStartDate = new Date(activeSession["session_start_date"])
          this.sessionEndDate = new Date(activeSession["session_end_date"])
          
          resolve(true)
        }
      }, (error: any) =>{
        console.log(error)
        this.apiDataLoaded =true
        reject(false)
      })
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
          this.clientLoaded = true
          this.pageTitle.set(`${this.clientDetails.first_name} ${this.clientDetails.last_name}`)
          resolve(true)
        }
      }, (error: any) =>{
        console.log(error)
        this.clientLoaded = true
        reject(false)
      })
    })

  }

  setChatStatus(){
    var body = {
      "client_id": this.clientId
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: false,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('therapist/toggle-chat', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        var response = data.data
      }
    }, (error: any) =>{
      console.log(error)
    })

  }

  deleteClient(){
    this.activityObj = {}
    this.showDeleteDialog = false
    var therapistId = localStorage.getItem("therapist_id")
    var body = {
      "client_id": this.clientId,
      "therapist_id": therapistId
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: false,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('therapist/delete-client', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        var response = data.data
        this.location.back()
      }
    }, (error: any) =>{
      console.log(error)
    })

  }



  copyContent(content: any){
    this.clipboard.copy(content);
  }
  /**
   * ngx-charts-line-chart renders nothing visible for a series with fewer
   * than 2 points (no line can be drawn) - used to show an explanatory
   * empty state instead of a silently blank graph.
   */
  hasEnoughTrendData(series: any[]): boolean {
    return series?.[0]?.series?.length >= 2
  }

  getProgressGraphData(){
    this.apiDataLoaded = false
    var body = {
      "client_therapist_mapping_id": this.clientDetails.client_therapist_mapping_id
    }
    this.lineChartData  = [
      {
        "name": "GREAT",
        "series": []
      },
    
      {
        "name": "GOOD",
        "series": []
      },
      {
        "name": "BAD",
        "series": []
      }
    ]
    this.phqLineChart = [
      {
        "name": "PHQ 9",
        "series": []
      },
      {
        "name": "GAD 7",
        "series": []
      }
    ]
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: false,
      createLoaderAction: false
    }
    this.serviceManager.CallBackendServiceAPI('therapist/progress-client-home', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        this.apiDataLoaded = true
        var response = data.data
        var index: any=1;
        response.reverse()
        response.forEach((data: any) => {
         this.lineChartData[0]["series"].push({ "value" : data["other"]["GREAT"] || 0, "name": "S"+ index})
         this.lineChartData[1]["series"].push({ "value" : data["other"]["GOOD"] || 0, "name": "S"+ index})
         this.lineChartData[2]["series"].push({ "value" : data["other"]["BAD"] || 0, "name": "S"+ index})
         this.phqLineChart[0]["series"].push({ "value" : typeof(data["questionnaire"]["phq_score"]) == "object"? 0 : data["questionnaire"]["phq_score"], "name": "S"+ index})
         this.phqLineChart[1]["series"].push({ "value" :  typeof(data["questionnaire"]["gad_score"]) == "object"? 0 : data["questionnaire"]["gad_score"], "name": "S"+ index})
         index +=1;
        });

      }
    }, (error: any) =>{
      // Without this the whole panel (including the Activities/Progress toggle) stays hidden.
      this.apiDataLoaded = true
      console.log(error)
    })

  }

  getActivities(){
    if(!this.currentSession){
      this.apiDataLoaded =true
      return
    }
    this.activityObj = {}
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
        this.apiDataLoaded =true
        var response = data.data
        response.forEach((activity: any) => {
          if(activity.activity_type_id == 1){
            if(!this.activityObj[activity.activity_status]){
              this.activityObj[activity.activity_status] = []
            }
            this.activityObj[activity.activity_status].push(activity)
          }
          else if(activity.activity_type_id == 2 || activity.activity_type_id == 3){
            if(!this.activityObj['PHQ9_GAD7']){
              this.activityObj["PHQ9_GAD7"] = []
            }
            this.activityObj["PHQ9_GAD7"].push(activity)
          }
          else{
            // Types 4-11: Self-Monitoring/Cognitive Exercise/Behavioral Activation/etc -
            // structured_response activities, kept separate from PHQ9/GAD7 scores.
            if(!this.activityObj['STRUCTURED']){
              this.activityObj["STRUCTURED"] = []
            }
            this.activityObj["STRUCTURED"].push(activity)
          }
        });
        this.getActivityScore()
        this.getCognitiveExerciseProgress()
      }
    }, (error: any) =>{
      this.apiDataLoaded =true
      console.log(error)
    })

  }

  getCognitiveExerciseProgress(){
    this.cognitiveExerciseProgress = null
    var body = {
      "client_therapist_mapping_id": this.clientDetails.client_therapist_mapping_id
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: false,
      showSuccessMessage: false,
      createLoaderAction: false
    }
    this.serviceManager.CallBackendServiceAPI('therapist/cognitive-exercise-progress', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data && data.data && data.data.completed_count > 0){
        this.cognitiveExerciseProgress = data.data
      }
    }, (error: any) =>{
      console.log(error)
    })
  }

  selectSession(session: any){
    this.apiDataLoaded =false
    this.currentSession = session
    this.getActivities()
  }

  selectCommentSession(session: any){
    this.commentSelectedSession = session
    this.getAllComments()
  }
  getActivityScore(){
    var activities:any = []
    for (var status in this.activityObj){
      if( status != 'TO DO' && status != 'STRUCTURED'){
        this.activityObj[status].forEach((activity: any) => {
          activities.push({
            "activity_id": activity.activity_id,
            "activity_type_id": activity.activity_type_id
        })
      });
      }
    }
    if (!activities.length)
      return
    var body = {
      "activities": activities
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: false,
      createLoaderAction: false
    }
    this.serviceManager.CallBackendServiceAPI('therapist/activities-client-home', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        var response = data.data[0] || {}
        for (var status in this.activityObj){
          if( status != 'TO DO'){
            this.activityObj[status] = this.activityObj[status].map((activity: any) => {
              activity = Object.assign({}, activity, response[activity.activity_id])
              return activity
          });
          }
        }
      }
          
        }, (error: any) =>{
      console.log(error)
    })

  }

  showAddActivity(){
    this.router.navigate(['/client/add-activity'], {
      queryParams: {
        id: this.clientId,
        session: this.latestSession.session_id
      }
    })
  }

  showAddSession(){
    this.router.navigate(['/client/add-session'], {
      queryParams: {
        id: this.clientId
      }
    })
  }

  /**
   * Chat has no push channel, so while the chat panel is on screen we re-fetch
   * messages every few seconds. Polls are silent (no loader, no error toast) and
   * only re-render when something actually changed.
   */
  startMessagePolling(){
    this.stopMessagePolling()
    this.messagePollTimer = setInterval(() => {
      // Only while the Messages panel is showing; also skip while the browser tab
      // is hidden or a send is in flight.
      if(this.sidePanel != 'Messages' || !this.clientDetails.is_chat_active || document.hidden || this.sendStatus){
        return
      }
      this.getMessages(true)
    }, this.MESSAGE_POLL_MS)
  }

  stopMessagePolling(){
    if(this.messagePollTimer){
      clearInterval(this.messagePollTimer)
      this.messagePollTimer = null
    }
  }

  ngOnDestroy(): void {
    this.stopMessagePolling()
  }

  getMessages(silent: boolean = false){
    return new Promise((resolve, reject)=> {
      var body = {
        "client_therapist_mapping_id": this.clientDetails.client_therapist_mapping_id
      }
      const customOptions : HttpCustomOptions = {
        showErrorMessage: !silent,
        showSuccessMessage: false,
        createLoaderAction: false
      }
      this.serviceManager.CallBackendServiceAPI('therapist/get-messages', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
        if(data){
          var response = data.data
          var lastMessage = response[response.length - 1]
          var signature = response.length + '|' + (lastMessage ? lastMessage.message_timestamp : '')
          if(silent && signature == this.messageSignature){
            resolve(true)
            return
          }
          this.messageSignature = signature
          this.messageObj = {}
          this.messageList = response
          this.messageSort(false)
          this.messageList.forEach((message: any) => {
            var sendDate = this.serviceManager.showDate(message.message_timestamp, CHAT_DAY_FORMAT)
            message.time = this.serviceManager.showTime(message.message_timestamp)
            if(!this.messageObj[sendDate]){
              this.messageObj[sendDate] = []
            }
            this.messageObj[sendDate].push(message)
          });  
          this.scrollToBottom()
          this.messagesLoaded = true
          resolve(true)     
        }
      }, (error: any) =>{
        console.log(error)
        this.messagesLoaded = true
        resolve(true)
      })
    })
  }
  /** The active session's "next session" date is before today and no new session exists. */
  get nextSessionPassed(): boolean {
    var next = this.clientDetails?.next_session
    if(!next){
      return false
    }
    var date = moment(String(next).split(' ')[0], 'YYYY-MM-DD', true)
    return date.isValid() && date.isBefore(moment().startOf('day'))
  }

  showDate(date: any){
    return this.serviceManager.formatDisplayDate(date)
  }

  sendMessage(){
    if(this.sendStatus || !this.sendMessageTxt.trim()){
      return
    }
    this.sendStatus = true
      var body = {
        "client_therapist_mapping_id": this.clientDetails.client_therapist_mapping_id,
        "message_text": this.sendMessageTxt
      }
      const customOptions : HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: false,
        createLoaderAction: false
      }
      this.serviceManager.CallBackendServiceAPI('therapist/send-message', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
        if(data){
          var response = data.data[0]
            this.sendStatus = false
            var sendTime = response.message_timestamp.split(" ")
            var sendDate = this.serviceManager.showDate(response.message_timestamp, CHAT_DAY_FORMAT)
            if(!this.messageObj[sendDate]){
              this.messageObj[sendDate] = []
            }
            var chatObj = {
              time: this.serviceManager.showTime(response.message_timestamp),
              role: "THERAPIST",
              message_text: this.sendMessageTxt
            }
            this.messageObj[sendDate].push(chatObj) 
            this.sendMessageTxt = ""
            this.scrollToBottom()
        }
      }, (error: any) =>{
        this.sendStatus = false
        console.log(error)
      })
  }

  getAllComments(){
    this.progressComments = {}
    this.commentsLoaded = false
    return new Promise((resolve, reject)=> {
      var body = {
        "session_id":this.commentSelectedSession.session_id
      }
      const customOptions : HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: false,
        createLoaderAction: false
      }
      this.serviceManager.CallBackendServiceAPI('therapist/get-session-comments', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
        if(data){
          var response = data.data
          this.progressCommentList = response
          this.commentsLoaded = true
          this.progressCommentSort(true) 
          this.progressCommentList.forEach((comment: any) => {
            var date = [comment.date,comment.time_val].join(" ")
            comment.time_val = this.serviceManager.showTime(date)
            var calcDate = this.serviceManager.showMessageDate(date)
            if(!this.progressComments[calcDate]){
              this.progressComments[calcDate] = []
            }
            this.progressComments[calcDate].push(comment)
          });
          resolve(true)
        }
      }, (error: any) =>{
        console.log(error)
        this.commentsLoaded = true
        reject(false)
      })
    })
  }

  progressCommentSort(isDescending: any){
    if(isDescending)
      this.progressCommentList = this.progressCommentList.sort((a : any, b : any) => (a.date > b.date) ? -1 : 1);
    else 
      this.progressCommentList = this.progressCommentList.sort((a : any, b : any) => (a.date < b.date) ? -1 : 1);
  }

  messageSort(isDescending: any){
    if(isDescending)
      this.messageList = this.messageList.sort((a : any, b : any) => (a.message_timestamp > b.message_timestamp) ? -1 : 1);
    else 
      this.messageList = this.messageList.sort((a : any, b : any) => (a.message_timestamp < b.message_timestamp) ? -1 : 1);
  }
  onToggleChange(){
    this.apiDataLoaded = false
    if(this.currentType == "Activities"){
      this.getActivities()
    }
    else{
      this.getProgressGraphData()
    } 
    
  }

  showActivityInfo(activity: any){
    localStorage.setItem("currentActivity", activity.activity_id)
    localStorage.setItem("currentSession", this.currentSession.session_id)
    this.router.navigate(['/client/activity'])
  }

  getActivityType(typeId: any): string {
    return this.structuredActivityTypeNames[typeId] || ''
  }

  trendBarHeight(value: any): number {
    return Math.max(0, Math.min(100, value)) / 100 * 90
  }

  formatTrendDate(timestamp: any): string {
    return moment(new Date(timestamp)).format('D MMM')
  }

  humanizeFieldKey(key: any): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
  }

  /** The latest PHQ-9 / GAD-7 total, or null when not answered. 0 is a real score. */
  questionnaireScore(activity: any): number | null {
    var score = activity.activity_type_id == 3 ? activity.gad_score : activity.phq_score
    return score === undefined || score === null ? null : score
  }

  /** Label/value rows for one structured response: known fields in form order, then any others. */
  structuredRows(response: any, labels: any): any[] {
    var keys = Object.keys(labels).filter((key: string) => key in response)
      .concat(Object.keys(response).filter((key: string) => !(key in labels)))
    return keys.map((key: string) => {
      var value = response[key]
      return {
        label: labels[key] || this.humanizeFieldKey(key),
        value: Array.isArray(value) ? value.join(', ') :
               typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
               (value === null || value === undefined || value === '') ? '-' : value
      }
    })
  }

  /** The backend's UTC timestamp as "Fri, 16 Oct 2026 · 09:39" in the therapist's timezone. */
  formatResponseTime(timestamp: any): string {
    if(!timestamp){
      return ''
    }
    var timezone: any = localStorage.getItem("timezone")
    var utc = String(timestamp).indexOf('Z') == -1 ? timestamp + 'Z' : timestamp
    var local = timezone ? moment.tz(utc, timezone) : moment(utc)
    return local.format("ddd, D MMM YYYY · HH:mm")
  }

  viewStructuredActivity(activity: any){
    this.selectedStructuredActivity = activity
    this.structuredResponses = []
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: false,
      createLoaderAction: false
    }
    this.serviceManager.CallBackendServiceAPI('therapist/get-activity-feedback', {activity_id: activity.activity_id}, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data && data.data && data.data.length){
        var labels = this.structuredFieldLabels[activity.activity_type_id] || {}
        // Every response, newest first (the API returns oldest first). Rows follow the
        // form's field order: MySQL re-sorts JSON object keys, so stored order isn't it.
        this.structuredResponses = data.data
          .filter((response: any) => response.structured_response)
          .reverse()
          .map((response: any) => ({
            when: this.formatResponseTime(response.feedback_timestamp),
            rows: this.structuredRows(response.structured_response, labels)
          }))
      }
      this.showStructuredModal = true
    }, (error: any) =>{
      console.log(error)
    })
  }


  updateSession(){
    var startDate = this.serviceManager.getFormattedDate(this.sessionStartDate)
    var endDate = this.serviceManager.getFormattedDate(this.sessionEndDate)
    var body:any = {
      "session_id": this.latestSession["session_id"]
    }
    
    if(startDate != this.latestSession['session_start_date'].split(' ')[0]){
      body["session_new_start_date"] = startDate
    }
    if(endDate != this.latestSession['session_end_date'].split(' ')[0]){
      body["session_new_end_date"] = endDate
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: true,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('therapist/edit-session', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        var response = data.data[0]
        this.latestSession = response
        this.getClientDetails()
        this.showSessionDialog = false
      }}, (error: any) =>{
      console.log(error)
    })
  }
}
