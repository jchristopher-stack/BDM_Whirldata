import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { AppImage } from 'src/constants/app-image';
import { ServiceManagerService } from 'src/app/service-manager.service';
import { TherapistHomeService } from '../therapist-home.service';
import { HttpMethod } from 'src/constants/constant';
import { HttpCustomOptions } from 'src/services/http-interceptor.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit, OnDestroy {

  clients:any = [];
  clientsCopy: any = []
  searchClient: any = "";
  apiLoaded: any = false;
  /** Tag filter options; a null value means "All tags". */
  tagOptions: { label: string; value: string | null }[] = [{ label: 'All tags', value: null }]
  selectedTag: string | null = null
  isDescending: any = true
  hoveredClient: any = null;

  /** True when the full client list (active + awaiting activation) came back empty.
      Shows the first-run welcome; decided from one response so it can't race the
      separate inactive-clients request. */
  isFirstRun = false
  /** "First Last" for the welcome heading; empty until therapist/get-details returns. */
  therapistName = ""
  /** The walkthrough video overlay. Opens by itself the first time a therapist lands
      here with no clients; after that only from the welcome card. */
  showWalkthrough = false
  /** The browser refused to start the narrated video with sound (it needs a recent click on
      the page), so it plays muted and the overlay offers "Turn on sound". */
  walkthroughSoundBlocked = false
  readonly walkthroughSrc = 'assets/videos/client-onboarding.mp4'
  readonly walkthroughPoster = 'assets/videos/client-onboarding-poster.jpg'
  readonly walkthroughCaptions = 'assets/videos/client-onboarding.en.vtt'
  private walkthroughEl?: HTMLVideoElement

  /** Starts the walkthrough as soon as its <video> exists: with sound when the browser allows
      it, otherwise muted (autoplay rules) with the "Turn on sound" button showing. */
  @ViewChild('walkthroughVideo') set walkthroughVideo(ref: ElementRef<HTMLVideoElement> | undefined) {
    if (!ref) {
      this.walkthroughEl?.pause()  // overlay closed: make sure the narration stops with it
      this.walkthroughEl = undefined
      return
    }
    if (ref.nativeElement === this.walkthroughEl) return
    const video = this.walkthroughEl = ref.nativeElement
    video.muted = false
    video.play().catch((err: DOMException) => {
      // Only an autoplay block gets the muted fallback; a missing or broken file keeps the
      // poster and controls instead of a "Turn on sound" that couldn't help.
      if (this.walkthroughEl !== video || err?.name !== 'NotAllowedError') return
      video.muted = true
      this.walkthroughSoundBlocked = true
      // If even muted playback is refused, the poster and controls stay; one click plays it.
      video.play().catch(() => {})
    })
  }

  constructor(public serviceManager: ServiceManagerService,
    private router: Router, public appImage: AppImage, public therapistHomeService: TherapistHomeService) {
    localStorage.removeItem("currentClient")
   }

  ngOnInit(): void {
    this.getClients()
  }

  /** Leaving the page with the overlay open (back, log out) must not leave narration playing. */
  ngOnDestroy(): void {
    this.walkthroughEl?.pause()
  }

  /**
   * Applies the search box and the tag filter together (each used to undo the
   * other), keeping whichever sort direction is selected.
   */
  applyFilters(){
    var searchText = this.searchClient.trim().toLowerCase()
    var tag = this.selectedTag?.toLowerCase()
    this.clients = this.clientsCopy.filter((e: any) => {
      var tagNames = e.purpose_of_visit.map((pov: any) => pov.purpose_of_visit_name.toLowerCase())
      var matchesSearch = !searchText ||
        e.first_name.toLowerCase().includes(searchText) ||
        e.last_name.toLowerCase().includes(searchText) ||
        e.city?.toLowerCase().includes(searchText) ||
        tagNames.some((name: string) => name.includes(searchText))
      var matchesTag = !tag || tagNames.includes(tag)
      return matchesSearch && matchesTag
    })
    this.sortByTime(this.isDescending)
  }

  /** True when the search box or tag filter is narrowing the list. */
  get isFiltered(): boolean {
    return !!this.searchClient.trim() || !!this.selectedTag
  }

  clearFilters(){
    this.searchClient = ""
    this.selectedTag = null
    this.applyFilters()
  }

  toggleSort(){
    this.sortByTime(!this.isDescending)
  }

  /** The first tags to show on a row; the rest collapse into "+N". */
  visibleTags(client: any): any[] {
    return client.purpose_of_visit.slice(0, 2)
  }

  hiddenTagNames(client: any): string {
    return client.purpose_of_visit.slice(2).map((pov: any) => pov.purpose_of_visit_name).join(', ')
  }

  /** A stable avatar tint per client (teal, yellow or neutral), so rows are easier to tell apart. */
  avatarTone(client: any): string {
    var name = `${client.first_name}${client.last_name}`
    var hash = 0
    for (var i = 0; i < name.length; i++) {
      hash = (hash + name.charCodeAt(i)) % 3
    }
    return 'tone-' + hash
  }

  /** Standard PHQ-9 severity bands. Returns null (no badge) when the client has no scored
      response of this type yet - phq_score/gad_score come back as null from the backend then. */
  phqBand(score: number | null): { label: string; tier: 'good' | 'monitor' | 'attention' } | null {
    if (score == null) { return null; }
    if (score >= 20) { return { label: 'Severe', tier: 'attention' }; }
    if (score >= 15) { return { label: 'Mod. Severe', tier: 'attention' }; }
    if (score >= 10) { return { label: 'Moderate', tier: 'monitor' }; }
    if (score >= 5) { return { label: 'Mild', tier: 'good' }; }
    return { label: 'Minimal', tier: 'good' };
  }

  /** Standard GAD-7 severity bands, same 3-tier mapping. */
  gadBand(score: number | null): { label: string; tier: 'good' | 'monitor' | 'attention' } | null {
    if (score == null) { return null; }
    if (score >= 15) { return { label: 'Severe', tier: 'attention' }; }
    if (score >= 10) { return { label: 'Moderate', tier: 'monitor' }; }
    if (score >= 5) { return { label: 'Mild', tier: 'good' }; }
    return { label: 'Minimal', tier: 'good' };
  }

  /** Direction chip next to a score badge - only shown once there's a previous score of the
      same type to compare against (delta is null on a client's first-ever assessment). */
  scoreTrend(delta: number | null | undefined): { arrow: string; cls: 'worsening' | 'improving'; value: number } | null {
    if (delta == null || delta === 0) { return null; }
    return delta > 0
      ? { arrow: '↑', cls: 'worsening', value: delta }
      : { arrow: '↓', cls: 'improving', value: Math.abs(delta) };
  }

  /** How long ago a score was recorded, and whether it's old enough that the badge might not
      reflect where the client actually is right now. */
  scoreRecency(timestamp: any): { text: string; stale: boolean } | null {
    if (!timestamp) { return null; }
    var scoreDate = new Date(new Date(timestamp).toDateString())
    var today = new Date(new Date().toDateString())
    var days = Math.round((today.getTime() - scoreDate.getTime()) / (1000 * 3600 * 24))
    var text = days <= 0 ? 'Updated today' : days === 1 ? 'Updated yesterday' : `Updated ${days} days ago`
    return { text: text, stale: days >= 14 }
  }

  /** Newer of the client's two score timestamps, for the single recency line under their name -
      the badges below it can be from different assessments, but one glance should say how
      current the roster row overall is. */
  latestScoreTimestamp(client: any): any {
    var phq = client.phq_score_timestamp
    var gad = client.gad_score_timestamp
    if (!phq) { return gad }
    if (!gad) { return phq }
    return new Date(phq).getTime() >= new Date(gad).getTime() ? phq : gad
  }

  clinicalRiskOf(client: any): 'safety' | 'watch' | 'stable' {
    const phq = this.phqBand(client.phq_score);
    const gad = this.gadBand(client.gad_score);
    const tiers = [phq?.tier, gad?.tier].filter(t => t);
    if (tiers.includes('attention')) { return 'safety'; }
    if (tiers.includes('monitor')) { return 'watch'; }
    return 'stable';
  }

  // Alerts come from every active client, not the filtered list, so searching
  // never hides a safety alert.
  get safetyAlertClients(): any[] {
    return this.clientsCopy.filter((c: any) => this.clinicalRiskOf(c) === 'safety');
  }

  /** Clients whose most recent chat message was from them and hasn't been replied to yet
      (real signal from ClientTherapistMessaging.role_id, sourced via get-all-clients). */
  get interactionAlertClients(): any[] {
    return this.clientsCopy.filter((c: any) => c.awaiting_reply);
  }

/**
 * Method used to get all clients based on therapist id
 */
getClients(){
    this.apiLoaded = false
    this.therapistHomeService.getInactiveClients()
    var therapistId = localStorage.getItem("therapist_id")
    var body = {
      "therapist_id": therapistId
    }
    const customOptions : HttpCustomOptions = {
      showErrorMessage: false,
      showSuccessMessage: false,
      createLoaderAction: false
    }
    this.serviceManager.CallBackendServiceAPI('therapist/get-all-clients', body, HttpMethod.POST, customOptions, true).subscribe( (data: any)=>{
      if(data){
        this.apiLoaded = true
        var response = data.data
        this.clients = response.filter((e:any)=> e.status == "ACTIVE")
        this.sortByTime(true)
        this.clientsCopy = JSON.parse(JSON.stringify(this.clients))
        this.getTags()
        this.setFirstRun(!response.length)
      }
    }, (error: any) =>{
      this.apiLoaded = true
      if(error.error.message == "No clients found."){
        this.clients = []
        this.clientsCopy = JSON.parse(JSON.stringify(this.clients))
        this.getTags()
        this.setFirstRun(true)
      }
      else{
        this.serviceManager.showMessage("Something went wrong")
      }
    })

  }

  getTags(){
    var names: string[] = []
    this.clientsCopy.forEach((client: any) => {
      client.purpose_of_visit.forEach((pov: any) => {
        if(!names.includes(pov.purpose_of_visit_name)){
          names.push(pov.purpose_of_visit_name)
        }
      })
    })
    names.sort((a, b) => a.localeCompare(b))
    this.tagOptions = [{ label: 'All tags', value: null }, ...names.map(name => ({ label: name, value: name }))]
  }
  navToAddClient(){
      this.router.navigate(['/add-client'])
  }

  /** localStorage key remembering that this therapist has already seen the walkthrough. */
  private walkthroughSeenKey(): string {
    return `walkthroughSeen:${localStorage.getItem("therapist_id")}`
  }

  /**
   * First run = no clients at all. Loads the therapist's name for the welcome heading and
   * opens the walkthrough once per therapist (per browser); "Watch" reopens it any time.
   */
  setFirstRun(noClients: boolean){
    this.isFirstRun = noClients
    if(!noClients) return
    this.getTherapistName()
    var seen = false
    try { seen = localStorage.getItem(this.walkthroughSeenKey()) === "true" } catch (e) {}
    if(!seen){
      this.openWalkthrough()
    }
  }

  getTherapistName(){
    if(this.therapistName) return
    const customOptions : HttpCustomOptions = {
      showErrorMessage: false,
      showSuccessMessage: false,
      createLoaderAction: false
    }
    var body = { "therapist_id": localStorage.getItem("therapist_id") }
    this.serviceManager.CallBackendServiceAPI('therapist/get-details', body, HttpMethod.POST, customOptions, true).subscribe((data: any) => {
      var details = data?.data?.[0]
      if(details){
        this.therapistName = [details.first_name, details.last_name].filter((part: string) => part).join(" ")
      }
    }, () => {
      // The heading reads "Welcome" without a name; nothing else depends on it.
    })
  }

  openWalkthrough(){
    this.walkthroughSoundBlocked = false
    this.showWalkthrough = true
    try { localStorage.setItem(this.walkthroughSeenKey(), "true") } catch (e) {}
  }

  unmuteWalkthrough(){
    const video = this.walkthroughEl
    if(!video) return
    video.muted = false
    this.walkthroughSoundBlocked = false
    if(video.paused){ video.play().catch(() => {}) }
  }

  /** Unmuting from the player's own controls also hides "Turn on sound". */
  onWalkthroughVolumeChange(){
    if(this.walkthroughEl && !this.walkthroughEl.muted){ this.walkthroughSoundBlocked = false }
  }

  addClientFromWalkthrough(){
    this.showWalkthrough = false
    this.navToAddClient()
  }

  showNextSessionDays(date: any){
    var dateStr = date.split(' ')[0]
    var dateList = dateStr.split('-')
    var calcDate = [dateList[1], dateList[2], dateList[0]].join('/')
    var sessionDate = new Date(calcDate)
    var currentDate = new Date(new Date().toDateString())
    var Difference_In_Time = sessionDate.getTime() - currentDate.getTime();
    return Difference_In_Time / (1000 * 3600 * 24)

  }

  /** Turns the raw +/-N day count from showNextSessionDays() into a clear label - a
      negative count on its own (e.g. "-13d") reads as a glitch rather than "13 days ago". */
  sessionDaysLabel(days: number): string {
    if (days === 0) { return 'Today'; }
    if (days === 1) { return 'Tomorrow'; }
    if (days === -1) { return 'Yesterday'; }
    if (days > 0) { return `In ${days} days`; }
    return `${Math.abs(days)} days ago`;
  }

  /** The next-session cell. Once that date has passed and no new session has been
      created, the client's app says "No session booked": say so here too. */
  sessionCell(date: string): { when: string, date: string, overdue: boolean } {
    var days = Math.round(this.showNextSessionDays(date))
    var shown = this.serviceManager.showCalendarDate(date)
    if (days < 0) {
      return { when: 'Next session not booked', date: `Last ${shown}`, overdue: true }
    }
    return { when: this.sessionDaysLabel(days), date: shown, overdue: false }
  }

  goToClientDetails(clientId: any){
    this.router.navigate(['/clients/client-details'], {
      queryParams: {
        id : clientId
      }
    })
  }

  sortByTime(isDesc: any){
    if(isDesc){
      this.clients = this.clients.sort((a : any, b : any) => (a.added_time > b.added_time) ? -1 : (a.added_time < b.added_time) ? 1 : 0);
      this.isDescending = true
    }
    else {
      this.clients = this.clients.sort((a : any, b : any) => (a.added_time < b.added_time) ? -1 : (a.added_time > b.added_time) ? 1 : 0);
      this.isDescending = false
    }

  }

  clearSearch(){
    this.searchClient = ""
    this.applyFilters()
  }

  /**
   * Searchs client list
   */
  searchClientList(){
    this.applyFilters()
  }
}
