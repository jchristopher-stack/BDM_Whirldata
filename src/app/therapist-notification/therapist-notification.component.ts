import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import 'moment-timezone';

import { AppImage } from 'src/constants/app-image';
import { HttpMethod } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';
import { ServiceManagerService } from '../service-manager.service';
import { TherapistHomeService } from '../therapist-home/therapist-home.service';

/** Notifications that share a calendar day (in the therapist's timezone). */
interface NotificationGroup {
  key: string
  label: string
  items: any[]
}

@Component({
  selector: 'app-therapist-notification',
  templateUrl: './therapist-notification.component.html',
  styleUrls: ['./therapist-notification.component.css']
})
export class TherapistNotificationComponent implements OnInit {

  notificationType: string = "Messages";
  typeOptions = [{ label: 'Messages', value: 'Messages' }, { label: 'Activities', value: 'Activities' }]
  /** Notifications on the current tab, after the tag filter and sort. */
  messageList: any = []
  messageListCopy: any = []
  /** messageList split by day, in the same order as the sort. */
  groups: NotificationGroup[] = []
  isSelectAll: any = false
  isApiLoaded: any = false;
  isDescending: any = true;
  tagList: any = ["ALL"]
  selectedTag: any = "ALL"
  showClearConfirm: boolean = false

  /**
   * Creates an instance of therapist notification component.
   * @param serviceManager
   * @param router
   * @param appImage
   */
  constructor(public serviceManager: ServiceManagerService,
    public router: Router, public appImage: AppImage,
    /** Clients who haven't activated the app yet: the sidebar loads them, the side panel here lists them. */
    public therapistHomeService: TherapistHomeService) {
    this.getNotifications()
  }

  ngOnInit(): void { }

  get tagOptions(): any[] {
    return this.tagList.map((tag: string) => ({ label: tag == "ALL" ? "All purposes" : tag, value: tag }))
  }

  /** How many notifications a tab holds, before the tag filter. */
  typeCount(type: string): number {
    return this.messageListCopy.filter((msg: any) => this.matchesType(msg, type)).length
  }

  get selectedCount(): number {
    return this.messageList.filter((msg: any) => msg.checked).length
  }

  selectTag(tag: any) {
    this.selectedTag = tag
    this.applyFilters()
  }

  getNotifications() {
    return new Promise((resolve, reject) => {
      this.isApiLoaded = false
      var therapistId = localStorage.getItem("therapist_id")
      var body = {
        "therapist_id": therapistId
      }
      const customOptions: HttpCustomOptions = {
        showErrorMessage: true,
        showSuccessMessage: false,
        createLoaderAction: false
      }
      this.serviceManager.CallBackendServiceAPI('therapist/get-notifications', body, HttpMethod.POST, customOptions, true).subscribe((data: any) => {
        if (data) {
          var response = data.data
          this.messageListCopy = JSON.parse(JSON.stringify(response))
          this.isApiLoaded = true
          this.onToggleChange()
          resolve(true)
        }
      }, (error: any) => {
        console.log(error)
        this.isApiLoaded = true
        reject(false)
      })
    })

  }

  /** Tags (purposes of visit) found on the current tab, so the filter never offers an empty choice. */
  getTags() {
    this.tagList = ["ALL"]
    this.messageListCopy.filter((msg: any) => this.matchesType(msg, this.notificationType)).forEach((message: any) => {
      message.purpose_of_visit.forEach((pov: any) => {
        if (!this.tagList.includes(pov.purpose_of_visit_name)) {
          this.tagList.push(pov.purpose_of_visit_name)
        }
      })
    });
    if (!this.tagList.includes(this.selectedTag)) {
      this.selectedTag = "ALL"
    }
  }

  sortByTime(isDesc: any) {
    this.isDescending = Boolean(isDesc)
    this.applyFilters()
  }

  /** Rebuilds the visible list from the full copy: tab, then tag, then sort, then day groups. */
  applyFilters() {
    var list = this.messageListCopy.filter((msg: any) => this.matchesType(msg, this.notificationType))
    if (this.selectedTag != "ALL") {
      list = list.filter((msg: any) => msg.purpose_of_visit.some((pov: any) => pov.purpose_of_visit_name == this.selectedTag))
    }
    var direction = this.isDescending ? -1 : 1
    list.sort((a: any, b: any) => (a.notification_timestamp < b.notification_timestamp ? -1 : 1) * direction)
    // Anything the filter hides stops being selected, so Clear only touches what's on screen.
    this.messageListCopy.forEach((msg: any) => {
      if (!list.includes(msg)) {
        msg.checked = false
      }
    })
    this.messageList = list
    this.groups = this.groupByDay(list)
    this.updateSelectAll()
  }

  clearNotification() {
    var clearNotificationList = this.messageList.filter((message: any) => message.checked).map((msg: any) => msg.notification_id)
    if (!clearNotificationList.length)
      return
    var body = {
      "notification_id": clearNotificationList
    }
    const customOptions: HttpCustomOptions = {
      showErrorMessage: true,
      showSuccessMessage: false,
      createLoaderAction: true
    }
    this.serviceManager.CallBackendServiceAPI('therapist/clear-notifications', body, HttpMethod.POST, customOptions, true).subscribe((data: any) => {
      if (data) {
        this.messageListCopy = this.messageListCopy.filter((message: any) => !clearNotificationList.includes(message.notification_id))
        this.getTags()
        this.applyFilters()
      }
    }, (error: any) => {
      console.log(error)
    })
  }

  onToggleChange() {
    this.messageListCopy.forEach((msg: any) => {
      msg["checked"] = false
    });
    this.getTags()
    this.applyFilters()
  }

  checkSelectExist(): boolean {
    /* Some, but not all, notifications are selected */
    return this.messageList.some((e: any) => e.checked) && !this.isSelectAll
  }

  updateSelectAll() {
    /* Method used to update select all checkbox */
    this.isSelectAll = this.messageList.length > 0 && this.messageList.every((e: any) => e.checked)
  }

  setSelectAll(val: any) {
    /* Method used to set checkbox values based on select all checkbox */
    this.messageList.forEach((client: any) =>
      client["checked"] = val
    );
    this.updateSelectAll()
  }

  showChat(message: any) {
    /* Method used to navigate to the client chat based on client id */
    this.serviceManager.navigateToPage('/clients/client-details', {
      id: message.client_id
    })
  }

  /** Message notifications are type 1; everything else (enrolled, activities done) is an activity update. */
  matchesType(message: any, type: string): boolean {
    return type == "Messages" ? message.notification_type_id === 1 : message.notification_type_id !== 1
  }

  /** The notification's own text; falls back to "<client> <type template>" when the text is empty. */
  notificationText(message: any): string {
    var text = (message.notification_text || "").trim()
    return text || `${message.client_name}${message.notifications_type_template || ""}`.trim()
  }

  initials(message: any): string {
    return (message.client_name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((part: string) => part[0]).join("").toUpperCase()
  }

  /** Same tint as the client's avatar on the Clients page (hash of the name without spaces). */
  avatarTone(message: any): string {
    var name = (message.client_name || "").replace(/\s+/g, "")
    var hash = 0
    for (var i = 0; i < name.length; i++) {
      hash = (hash + name.charCodeAt(i)) % 3
    }
    return 'tone-' + hash
  }

  /** Awaiting-activation clients ticked for a reminder. */
  get selectedInactiveCount(): number {
    return this.therapistHomeService.inactiveClients.filter((client: any) => client.checked).length
  }

  openClient(clientId: any) {
    this.serviceManager.navigateToPage('/clients/client-details', { id: clientId })
  }

  clientName(client: any): string {
    return `${client.first_name || ''} ${client.last_name || ''}`.trim()
  }

  /** "Added 13 Oct" (parsed the same way TherapistHomeService.isExpired reads added_time). */
  addedLabel(client: any): string {
    var added = moment(new Date(client.added_time))
    return client.added_time && added.isValid() ? `Added ${added.format("D MMM")}` : ""
  }

  /** The first tags to show on a row; the rest collapse into "+N". */
  visibleTags(message: any): any[] {
    return message.purpose_of_visit.slice(0, 2)
  }

  hiddenTagNames(message: any): string {
    return message.purpose_of_visit.slice(2).map((pov: any) => pov.purpose_of_visit_name).join(', ')
  }

  /** ISO timestamp for <time datetime>; the backend sends UTC without a zone. */
  isoTime(timestamp: string): string {
    return this.toLocal(timestamp).toISOString()
  }

  trackByNotification(index: number, message: any): string {
    return message.notification_id
  }

  trackByGroup(index: number, group: NotificationGroup): string {
    return group.key
  }

  private groupByDay(list: any[]): NotificationGroup[] {
    var groups: NotificationGroup[] = []
    var today = this.now().format("YYYY-MM-DD")
    var yesterday = this.now().subtract(1, "day").format("YYYY-MM-DD")
    list.forEach((message: any) => {
      var local = this.toLocal(message.notification_timestamp)
      var key = local.format("YYYY-MM-DD")
      var group = groups.find(g => g.key == key)
      if (!group) {
        var label = key == today ? "Today" : key == yesterday ? "Yesterday" : local.format("ddd, D MMM YYYY")
        group = { key, label, items: [] }
        groups.push(group)
      }
      group.items.push(message)
    })
    return groups
  }

  /** The backend's UTC timestamp in the therapist's timezone (same rule as ServiceManager.showTime). */
  private toLocal(timestamp: string): moment.Moment {
    var timezone: any = localStorage.getItem("timezone")
    var utc = timestamp.indexOf('Z') == -1 ? timestamp + 'Z' : timestamp
    return timezone ? moment.tz(utc, timezone) : moment(utc)
  }

  private now(): moment.Moment {
    var timezone: any = localStorage.getItem("timezone")
    return timezone ? moment.tz(timezone) : moment()
  }

}
