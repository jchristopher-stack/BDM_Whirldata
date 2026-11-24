import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ServiceManagerService } from '../service-manager.service';
import { TherapistHomeService } from '../therapist-home/therapist-home.service';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SideBarComponent implements OnInit {

  expandedNotification: boolean = false;
  showLogoutDialog: boolean = false;
  /** Every screen that belongs under "Clients" in the sidebar. */
  clientRoutes = ['/clients', '/add-client', '/add-client/add-activity', '/clients/client-details',
    '/client/activity', '/client/add-activity', '/client/edit-activity', '/client/add-session'];

  constructor(public router: Router, public serviceManager: ServiceManagerService, public therapistHomeService: TherapistHomeService) { }
  ngOnInit(): void {
    this.serviceManager.getLogo()
    this.therapistHomeService.getInactiveClients()
  }

  /** Clients ticked in the notifications panel (the reminder goes to these). */
  get selectedCount(): number {
    return this.therapistHomeService.inactiveClients.filter((client: any) => client.checked).length
  }

  toggleNotification(): void {
    this.expandedNotification = !this.expandedNotification
  }

  goToClientDetails(clientId: any): void {
    this.router.navigate(['/clients/client-details'], {
      queryParams: {
        id: clientId
      }
    })
  }

  /**
   * Whether the current page is one of these routes
   * @param availableRoutes 
   */
  isActive(availableRoutes: string[]){
    return availableRoutes.includes(this.router.url.split('?')[0])
  }

  /**
   * Toggles logout modal
   */
  toggleLogoutModal(){
    this.showLogoutDialog = !this.showLogoutDialog;
  }
}
