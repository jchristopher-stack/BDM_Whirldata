import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { tap } from "rxjs/operators";
import { Router } from "@angular/router";
import { LoaderPopConfig, LoaderPopService } from "src/components/loader-pop/loader-pop.service";
import { MessagePopConfig, MessagePopConstants, MessagePopService } from "src/components/message-pop/message-pop.service";

export interface HttpCustomOptions {
  createLoaderAction: boolean
  showErrorMessage: boolean
  showSuccessMessage: boolean
  errorMessage?: string
  successMessage?: string
}


@Injectable({
  providedIn: 'root'
})
export class HttpCustomService {
  constructor(private http: HttpClient, private loaderPopService: LoaderPopService, private messagePopService: MessagePopService) { }
  
  /*
    This class used to execute the http call with handling of the request and response.
    Types of calls are get, post, put, delete, patch.
  */
  get<T>(url: string, options?: object, customOptions?: HttpCustomOptions): Observable<T> {
    this.requestHandle(customOptions);
    return this.http.get<T>(url, options).pipe(
      tap(
        (success) => this.handleSuccess(success, customOptions),
        (error) => this.handleError(error, customOptions)
      )
    );
  }

  post<T>(url: string, body: any, options?: object, customOptions?: HttpCustomOptions): Observable<T> {
    this.requestHandle(customOptions);
    return this.http.post<T>(url, body, options).pipe(
      tap(
        (success) => this.handleSuccess(success, customOptions),
        (error) => this.handleError(error, customOptions)
      )
    );
  }

  put<T>(url: string, body: any, options?: object, customOptions?: HttpCustomOptions): Observable<T> {
    this.requestHandle(customOptions);
    return this.http.put<T>(url, body, options).pipe(
      tap(
        (success) => this.handleSuccess(success, customOptions),
        (error) => this.handleError(error, customOptions)
      )
    );
  }

  delete<T>(url: string, options?: object, customOptions?: HttpCustomOptions): Observable<T> {
    this.requestHandle(customOptions);
    return this.http.delete<T>(url, options).pipe(
      tap(
        (success) => this.handleSuccess(success, customOptions),
        (error) => this.handleError(error, customOptions)
      )
    );
  }

  patch<T>(url: string, body: any, options?: object, customOptions?: HttpCustomOptions): Observable<T> {
    return this.http.patch<T>(url, body, options).pipe(
      tap(
        (success) => this.handleSuccess(success, customOptions),
        (error) => this.handleError(error, customOptions)
      )
    );
  }

  /**
   * Method used to hide the loader show the error message.
   * @param response 
   * @param [customOptions] 
   */
  private async handleError(response: any, customOptions?: HttpCustomOptions) {
    if(customOptions?.createLoaderAction){
      this.handleLoader(false)
    }
    if(customOptions?.showErrorMessage){
      const messageConfig: MessagePopConfig = {
        message: customOptions.errorMessage || response?.error?.message || 'Something went wrong. Please try again.',
        status: MessagePopConstants.FAILURE,
      };
      this.messagePopService.notifySubject.next(messageConfig);
    }
  }

  /**
   * Method used to hide the loader show the success message.
   * @param response 
   * @param [customOptions] 
   */
  private async handleSuccess(response: any, customOptions?: HttpCustomOptions) {
    if(customOptions?.createLoaderAction){
      this.handleLoader(false)
    }
    if(customOptions?.showSuccessMessage){
      const messageConfig: MessagePopConfig = {
        message: customOptions?.successMessage || response?.message || '',
        status: MessagePopConstants.SUCCESS,
      };
      this.messagePopService.notifySubject.next(messageConfig);  
    }
  }

  /**
   * Method used to handle the request before API call and shows the loader.
   * @param [customOptions] 
   */
  private async requestHandle(customOptions?: HttpCustomOptions){
    if(customOptions?.createLoaderAction){
      this.handleLoader(true)
    }
  }

  /**
   * Method used to show or hide loader based on the params.
   * @param showValue 
   */
  handleLoader(showValue: any){
    const loaderConfig: LoaderPopConfig = {
      createAction: showValue
    }
    this.loaderPopService.notifySubject.next(loaderConfig)
  }
}
