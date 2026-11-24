import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AppImage {

    constructor() { }
    activeClient = "../assets/img/active-client-icon.svg"
    noActiveClients = "../assets/img/no-active-client.svg"
    noActivityNotification = "../assets/img/no-activity-notify.png"
    noMessageNotification = "../assets/img/no-message-notify.png"
    noInactiveClients = "../assets/img/no-inactive-client.svg"
    search = "../assets/img/search.svg"
    sortAsc = "../assets/img/asc.svg"
    sortDesc = "../assets/img/desc.svg"
    reminder = "../assets/img/reminder.svg"
    
}

