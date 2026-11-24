import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HttpCustomOptions, HttpCustomService } from 'src/services/http-interceptor.service';

import { HttpMethod } from '../constants/constant';
import { Router } from '@angular/router';
import { MessagePopConfig, MessagePopConstants, MessagePopService } from 'src/components/message-pop/message-pop.service';
import { LoaderPopConfig, LoaderPopService } from 'src/components/loader-pop/loader-pop.service';
import * as moment from 'moment';
import 'moment-timezone';
import { CookieService } from 'ngx-cookie-service';

/** Every date shown to users is day-first (QA sheet #24/#25). */
export const DISPLAY_DATE_FORMAT = "DD/MM/YYYY";

@Injectable({
  providedIn: 'root'
})
export class ServiceManagerService {

  private envFileUrl = "assets/prod.json";
  therapistLogo: any = "../../assets/img/TAAP.svg"

  /**
   * Creates an instance of service manager service.
   * @param httpCommonService 
   * @param router 
   * @param httpClient 
   * @param messagePopService 
   * @param loaderPopService 
   * @param cookieService 
   */
  constructor(private httpCommonService: HttpCustomService, 
              public httpClient: HttpClient, 
              public router: Router, 
              public messagePopService: MessagePopService, 
              public loaderPopService: LoaderPopService, 
              private cookieService: CookieService) { 
    
    // Get prod.json file for local setup
    this.httpClient.get(this.envFileUrl).subscribe((data: any) => {
      localStorage.setItem("url", data["url"])
    }, (error: any) => {});

    // Check privacy policy accept status
    this.checkPolicy().then((policy: any) => {
      !policy? this.navigateToPage('/privacy-policy'): ''
    })
  }

  /**
   * Calls backend service api
   * @param serviceName 
   * @param body 
   * @param [method] 
   * @param [customOptions] 
   * @param [authTokenRequired] 
   * @returns  
   */
  public CallBackendServiceAPI(serviceName: string, body: any, 
    method: string = HttpMethod.POST, customOptions ?:HttpCustomOptions, 
    authTokenRequired: boolean = true) {
    var privacyAgree = localStorage.getItem("isAgree")
    if(!privacyAgree && this.isLoggedIn() && 
        !['therapist/get-privacy-policy', 
        'therapist/check-privacy-policy-compliance'].includes(serviceName)){
        this.navigateToPage('/privacy-policy')
    }
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      })
    };
    if(authTokenRequired){
      httpOptions.headers = httpOptions.headers.set('Authorization', 
                                                    this.getUserAuthToken())
    }
    const endpointURL = this.getBackendUrl() + serviceName;
    const defaultCustomOptions: HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: false,
      createLoaderAction: true
    }
    switch(method){
      case HttpMethod.GET:
          return this.httpCommonService.get(
              endpointURL,
              httpOptions,
              customOptions || defaultCustomOptions
          );
      case HttpMethod.PUT:
          return this.httpCommonService.put(
              endpointURL,
              body,
              httpOptions,
              customOptions || defaultCustomOptions
          );
      case HttpMethod.DELETE:
          return this.httpCommonService.delete(
              endpointURL,
              httpOptions,
              customOptions || defaultCustomOptions
          );
      default:
        return this.httpCommonService.post(
          endpointURL,
          body,
          httpOptions,
          customOptions || defaultCustomOptions
      );
    }
  }

  /**
   * Navigates to page
   * @param page 
   * @param [queryParams] 
   */
  public navigateToPage(page: any, queryParams = {}){
    this.router.navigate([page], { queryParams: queryParams})
  }

  /**
   * Navigates to page with state
   * @param page 
   * @param [state] 
   */
  navigateToPageWithState(page: any, state = {}){
    this.router.navigate([page], { state: state})
  }
  
  /**
   * Gets backend url
   * @returns  
   */
  getBackendUrl(){
    var url = localStorage.getItem("url")
    return url || '/api/'
  }

  /**
   * Gets user auth token
   * @returns user auth token 
   */
  public getUserAuthToken():any{
    var idToken = this.cookieService.get("idToken")
    if(!idToken){
      this.showMessage("Your session has expired. Please sign in again.")
      this.logoutTherapist()
      return
    }
    return idToken
  }

  /**
   * Determines whether filled is
   * @param inputVar 
   * @returns true or false
   */
  isFilled(inputVar: any){
    return inputVar !== undefined && inputVar !== null && inputVar.toString().trim()
  }

  /**
   * Determines whether logged in is
   * @returns true or false
   */
  isLoggedIn(){
    var token =  this.cookieService.get('idToken') || ''
    return this.isFilled(token)
  }

  /**
   * Navigate to valid route
   */
  navToValidRoute(){
    let url = this.router.url.split("?")[0]
    var is_valid = ['/sign-up', '/sign-in', '/set-password',
                    "/reset-password", '/forgot-password'].includes(url) && 
                    this.isLoggedIn()
    if(is_valid){
      this.navigateToPage('/clients')
    }
  }

  /**
   * Shows message
   * @param message 
   */
  showMessage(message: any){
    const messageConfig: MessagePopConfig = {
      message: message,
      status: MessagePopConstants.FAILURE,
    };
    this.messagePopService.notifySubject.next(messageConfig);
  }

  /**
   * Gets logo of therapist
   */
  getLogo(){
    if(!this.isLoggedIn()){
      return
    }
    var therapistId = localStorage.getItem("therapist_id")
    var body = {
      "therapist_id": therapistId 
    }
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': this.getUserAuthToken()
      }),
      responseType:  'blob' as 'json' 
    }
    var url = this.getBackendUrl() + "therapist/get-logo"
    this.httpClient.post<string>(url, body, httpOptions).subscribe((data: any) => {
      let reader = new FileReader();
      reader.addEventListener("load", () => {
          this.therapistLogo = reader.result;
      }, false);
      if (data) {
          reader.readAsDataURL(data);
      }
    },(error: any)=>{
      console.log(error);
      
    });
  }

  /**
   * Shows loader
   */
  showLoader(){
      const loaderConfig: LoaderPopConfig = {
        createAction: true
      }
      this.loaderPopService.notifySubject.next(loaderConfig)
  }

  /**
   * Hides loader
   */
  hideLoader(){
    const loaderConfig: LoaderPopConfig = {
      createAction: false
    }
    this.loaderPopService.notifySubject.next(loaderConfig)
  }

  /**
   * Logouts therapist
   */
  logoutTherapist(){
    this.cookieService.delete("idToken")
    localStorage.removeItem("therapist_id")
    localStorage.removeItem("currentActivity")
    localStorage.removeItem("currentSession")
    localStorage.removeItem("client")
    localStorage.removeItem("timezone")
    localStorage.removeItem("isAgree")
    this.navigateToPage('/sign-in')
  }

  /**
   * Checks policy status
   * @returns  
   */
  checkPolicy(){
    return new Promise((resolve, reject) => {
      var therapistId = localStorage.getItem("therapist_id")
      if(!therapistId){
        return
      }
      var body = {
        "therapist_id" : therapistId,
      }
      const customOptions : HttpCustomOptions = {
        showErrorMessage: false,
        showSuccessMessage: false,
        createLoaderAction: true
      }
      this.CallBackendServiceAPI('therapist/check-privacy-policy-compliance', body, HttpMethod.POST, customOptions).subscribe( (data: any)=>{
        if(data){
          var response = data.data[0]
          if(response == true)
            localStorage.setItem("isAgree", "true")
          else if(this.isLoggedIn()){
              localStorage.removeItem("isAgree")
          }
          resolve(response)
        }
      }, (error: any) =>{
        console.log(error)
        reject(false)
      })
    })
  }

  /**
   * Shows date based on the therapist zone date format
   * @param date 
   * @returns  
   */
  showDate(date: any, format: string = DISPLAY_DATE_FORMAT){
    var timezone:any = localStorage.getItem("timezone")
    return moment.tz(date.indexOf('Z')== -1 ? date +'Z': date, timezone).format(format)
  }

  /**
   * Shows time based on the therapist  zone time format
   * @param date 
   * @returns  
   */
  showTime(date: any){
    var timezone:any = localStorage.getItem("timezone")
    return moment.tz(date.indexOf('Z')== -1 ? date +'Z': date, timezone).format("HH:mm")
  }

  /**
   * Shows message date
   * @param date 
   * @returns  
   */
  showMessageDate(date: any){
    var timezone:any = localStorage.getItem("timezone")
    return moment.tz(date, timezone).format("DD MMM YYYY")
  }

  /**
   * Formats a date (Date, or a string the browser can parse) as DD/MM/YYYY.
   * Returns "Invalid Date" for unusable input - templates compare against it.
   */
  formatDisplayDate(date: any){
    // new Date("2026-10-21") is UTC midnight, the day before west of UTC.
    var dateOnly = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
    var parsed = dateOnly ? moment(date, 'YYYY-MM-DD') : moment(date instanceof Date ? date : new Date(date))
    return parsed.isValid() ? parsed.format(DISPLAY_DATE_FORMAT) : "Invalid Date"
  }

  /**
   * A calendar date from the backend (activity deadline, session date) as DD/MM/YYYY.
   * These are dates, sent as "YYYY-MM-DD 00:00:00": show the date as it is. Treating it as
   * a UTC instant (showDate) moves it to the day before for therapists west of UTC.
   */
  showCalendarDate(date: any){
    if(!date){
      return ""
    }
    var parsed = moment(String(date).split(' ')[0], 'YYYY-MM-DD', true)
    return parsed.isValid() ? parsed.format(DISPLAY_DATE_FORMAT) : "Invalid Date"
  }

  /**
   * Parses a typed DD/MM/YYYY (or D/M/YYYY) date strictly, so 04/11/1989 is
   * always 4 November. Returns "YYYY-MM-DD", or "Invalid Date".
   */
  parseDisplayDate(value: any){
    var parsed = moment(String(value || '').trim(), [DISPLAY_DATE_FORMAT, "D/M/YYYY"], true)
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "Invalid Date"
  }

  /**
   * Gets formatted date
   * @param date 
   * @returns  formatted date
   */
  getFormattedDate(date: any){
    const format = "YYYY-MM-DD";
    if(!date){
      return date;
    }
    return moment(date).format(format);
  }
}


