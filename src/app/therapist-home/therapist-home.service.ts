import { Injectable } from '@angular/core';
import { ServiceManagerService } from '../service-manager.service';
import { HttpMethod } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';

@Injectable({
  providedIn: 'root'
})
export class TherapistHomeService {

  inactiveClients: any[] = [];
  isSelectAll: boolean = false;

  constructor(private serviceManager: ServiceManagerService) {}

  /**
   * Loads the therapist's inactive (awaiting-activation) clients. Lives here rather than on
   * home-page.component so the sidebar's notification bell can show/act on this list from any
   * page, not just the Clients Dashboard.
   */
  getInactiveClients(): void {
    if (!this.serviceManager.isLoggedIn()) return
    var therapistId = localStorage.getItem("therapist_id");
    var body = {
      "therapist_id": therapistId
    }
    const customOptions: HttpCustomOptions = {
      showErrorMessage: false,
      showSuccessMessage: false,
      createLoaderAction: false
    }
    this.serviceManager.CallBackendServiceAPI('therapist/get-all-clients', body, HttpMethod.POST, customOptions, true).subscribe((data: any) => {
      if (data) {
        var response = data.data
        this.inactiveClients = response.filter((e: any) => e.status == "INACTIVE")
        this.inactiveClients.forEach((client: any) => {
          client['checked'] = false
        });
        this.updateSelectAll()
      }
    }, (error: any) => {
      if (error.error?.message == "No clients found.") {
        this.inactiveClients = []
      }
    })
  }

  checkSelectExist(): boolean {
    return this.inactiveClients.some((e: any) => e.checked) && !this.isSelectAll
  }

  updateSelectAll(): void {
    var selected = this.inactiveClients.filter((e: any) => e.checked)
    this.isSelectAll = this.inactiveClients.length > 0 && selected.length == this.inactiveClients.length
  }

  setSelectAll(val: any): void {
    this.inactiveClients.forEach((client: any) =>
      client["checked"] = val
    );
    this.updateSelectAll()
  }

  remindAll(): void {
    this.inactiveClients.forEach((client: any) => {
      client.checked = true
    })
    this.clientsRemainder()
  }

  clientsRemainder(): void {
    var clients: any = []
    this.inactiveClients.forEach((client: any) => {
      if (client.checked)
        clients.push(client.client_id)
    });
    var body = {
      "clients": clients
    }
    const customOptions: HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: true,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('therapist/remind-clients', body, HttpMethod.POST, customOptions, true).subscribe((data: any) => {
      if (data) {
        this.inactiveClients.forEach((client: any) => {
          client.checked = false
        })
        this.updateSelectAll()
      }
    }, (error: any) => {
      console.log(error)
    })
  }

  isExpired(createdAt: any): boolean {
    var timeDiff = new Date().getTime() - new Date(createdAt).getTime()
    return timeDiff / (1000 * 3600 * 24) >= 7
  }

  /**
   * Regenerates activation code
   * @param client
   */
  regenerateActivationCode(client: any): void {
    var body = {
      "client_id": client.client_id
    }
    const customOptions: HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: true,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('therapist/regenerate-activation-code', body, HttpMethod.POST, customOptions, true).subscribe((data: any) => {
      if (data) {
        client.added_time = new Date().toLocaleString()
      }
    }, (error: any) => {
      console.log(error)
    })
  }
}

@Injectable({
  providedIn: 'root'
})
export  class AddClientService {
  first_name: any;
  last_name: any;
  email_id: any;
  city: any;
  therapist_id: any;
  phone_number: any;
  purpose_of_visit: any;
  is_chat_active: any;
  role_id: any;
  constructor() {
    this.resetForm()
  }

  resetForm(){
    this.first_name= "";
    this.last_name= "";
    this.email_id= "";
    this.therapist_id="";
    this.phone_number="";
    this.city = "";
    this.purpose_of_visit="";
    this.role_id = 3;
    this.is_chat_active = false
  }
}
