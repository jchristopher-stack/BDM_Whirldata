import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';

interface ThemeOption {
  key: string;
  label: string;
  file: string;
  swatch: string;
}

interface OverdueActivity {
  id: number;
  name: string;
  daysOverdue: number;
  resolved: boolean;
}

interface AiMessage {
  role: 'user' | 'assistant';
  text?: string;
  steps?: string[];
  videoCard?: { title: string; source: string; duration: string; clientId: number; activityName: string; activityDescription: string };
  activityCard?: { name: string; description: string; clientId: number };
  summaryCard?: { clientId: number; bullets: string[] };
}

@Component({
  selector: 'app-ui-preview',
  templateUrl: './ui-preview.component.html',
  styleUrls: ['./ui-preview.component.scss'],
  providers: [MessageService]
})
export class UiPreviewComponent {

  themes: ThemeOption[] = [
    { key: 'taap', label: 'TAAP teal (design tokens)', file: 'taap.css', swatch: '#3F7D91' },
    { key: 'saga-green', label: 'Sage green', file: 'saga-green.css', swatch: '#4CAF50' },
    { key: 'saga-blue', label: 'Classic Blue', file: 'saga-blue.css', swatch: '#2196F3' },
    { key: 'saga-purple', label: 'Bold Purple', file: 'saga-purple.css', swatch: '#9C27B0' },
  ];
  activeTheme = 'taap';

  currentPage:
    | 'sitemap'
    | 'sign-in' | 'sign-up' | 'forgot-password' | 'set-password' | 'reset-password'
    | 'clients' | 'add-client' | 'settings' | 'client-details' | 'activity-details' | 'add-activity'
    | 'notifications-page' | 'privacy-policy' | 'ai-assistant'
    = 'sitemap';

  get isAuthPage(): boolean {
    return this.currentPage === 'sign-in' || this.currentPage === 'sign-up' || this.currentPage === 'forgot-password'
      || this.currentPage === 'set-password' || this.currentPage === 'reset-password' || this.currentPage === 'privacy-policy';
  }

  /** ================= AUTH (preview only) =================
      Mirrors the real screens' exact fields (email/password; email/activation code; email
      reset link). One mock account is "known" so wrong-email and wrong-password can be told
      apart, same as a real backend would - everything else in the app still never calls a
      real API, but these three screens now have real failure paths to demo, not just success. */
  readonly mockKnownEmail = 'therapist@example.com';
  readonly mockKnownPassword = 'Therapist@123';
  readonly mockKnownActivationCode = '123-456';

  authEmail = '';
  authPassword = '';
  authActivationCode = '';
  authError: string | null = null;

  signIn(): void {
    this.authError = null;
    const email = this.authEmail.trim().toLowerCase();
    if (!email || !this.authPassword.trim()) {
      this.authError = 'Enter both your email and password.';
      return;
    }
    if (email !== this.mockKnownEmail) {
      this.authError = 'No account found with that email address.';
      return;
    }
    if (this.authPassword !== this.mockKnownPassword) {
      this.authError = 'Incorrect password. Please try again.';
      return;
    }
    this.messageService.add({ severity: 'success', summary: 'Signed in', detail: 'Preview only.' });
    this.currentPage = 'clients';
  }

  signUp(): void {
    this.authError = null;
    const email = this.authEmail.trim().toLowerCase();
    if (!email || !this.authActivationCode.trim()) {
      this.authError = 'Enter both your email and activation code.';
      return;
    }
    if (this.authActivationCode.trim() !== this.mockKnownActivationCode) {
      this.authError = 'That activation code is invalid or has expired. Check with your admin for a new one.';
      return;
    }
    this.messageService.add({ severity: 'success', summary: 'Code verified', detail: 'Preview only — now set a password.' });
    this.currentPage = 'set-password';
  }

  /** True once "Send Link" succeeds - shows a simulated-email step with a link into Reset
      Password, since a real email deep link can't be demoed in a preview. */
  showResetLinkSentState = false;

  sendResetLink(): void {
    this.authError = null;
    const email = this.authEmail.trim().toLowerCase();
    if (!email) {
      this.authError = 'Enter your email address.';
      return;
    }
    if (email !== this.mockKnownEmail) {
      this.authError = 'No account found with that email address.';
      return;
    }
    this.showResetLinkSentState = true;
  }

  openSimulatedResetLink(): void {
    this.showResetLinkSentState = false;
    this.currentPage = 'reset-password';
  }

  goToAuthPage(page: 'sign-in' | 'sign-up' | 'forgot-password'): void {
    this.authError = null;
    this.authEmail = '';
    this.authPassword = '';
    this.authActivationCode = '';
    this.showResetLinkSentState = false;
    this.currentPage = page;
  }

  /** ================= SET / RESET PASSWORD (preview only) =================
      Two separate real screens with two separate entry points (post-signup vs. an emailed
      deep link), but the same field shape - kept as two small independent forms here too. */
  setPasswordValue = '';
  setPasswordConfirm = '';
  setPasswordError: string | null = null;

  submitSetPassword(): void {
    this.setPasswordError = null;
    if (!this.setPasswordValue || !this.setPasswordConfirm) {
      this.setPasswordError = 'Enter and confirm your new password.';
      return;
    }
    if (this.setPasswordValue.length < 8) {
      this.setPasswordError = 'Password must be at least 8 characters.';
      return;
    }
    if (this.setPasswordValue !== this.setPasswordConfirm) {
      this.setPasswordError = 'Passwords do not match.';
      return;
    }
    this.messageService.add({ severity: 'success', summary: 'Account created', detail: 'Preview only.' });
    this.currentPage = 'privacy-policy';
  }

  resetPasswordValue = '';
  resetPasswordConfirm = '';
  resetPasswordError: string | null = null;
  showResetSuccessDialog = false;

  submitResetPassword(): void {
    this.resetPasswordError = null;
    if (!this.resetPasswordValue || !this.resetPasswordConfirm) {
      this.resetPasswordError = 'Enter and confirm your new password.';
      return;
    }
    if (this.resetPasswordValue.length < 8) {
      this.resetPasswordError = 'Password must be at least 8 characters.';
      return;
    }
    if (this.resetPasswordValue !== this.resetPasswordConfirm) {
      this.resetPasswordError = 'Passwords do not match.';
      return;
    }
    this.showResetSuccessDialog = true;
  }

  closeResetSuccessDialog(): void {
    this.showResetSuccessDialog = false;
    this.resetPasswordValue = '';
    this.resetPasswordConfirm = '';
    this.currentPage = 'sign-in';
  }

  /** ================= PRIVACY POLICY (preview only) ================= */
  privacyPolicyText = `This Privacy Policy explains how we collect, use, and protect information within the Mental Health Therapist Portal.

We collect only the information necessary to support care coordination between therapists and clients: contact details, session scheduling, activity responses, and clinical assessment scores (such as PHQ-9 and GAD-7). This information is visible only to the assigned therapist and authorized administrators.

Client activity data, mood check-ins, and messages are used solely to support treatment planning and are never shared with third parties without consent, except where required by law (such as mandatory safety reporting).

Therapists are required to review and accept this policy before accessing client records, and are responsible for maintaining confidentiality in accordance with applicable regulations.`;

  agreeToPrivacyPolicy(): void {
    this.messageService.add({ severity: 'success', summary: 'Privacy policy accepted', detail: 'Preview only.' });
    this.currentPage = 'clients';
  }

  // Stats are now a permanent strip at the top of the page (not a per-layout choice), so the
  // switcher only needs to offer the two actual roster presentations.
  layouts = [
    { key: 'list', label: 'Enhanced List' },
    { key: 'triage', label: 'Priority Triage' },
  ];
  activeLayout = 'list';

  /** Which notification row is expanded in the bell panel, if any. */
  expandedNotification: 'privacy' | 'activation' | null = null;

  toggleNotification(key: 'privacy' | 'activation'): void {
    this.expandedNotification = this.expandedNotification === key ? null : key;
  }

  searchClient = '';
  selectedTag: string | null = null;
  isDescending = true;
  isSelectAll = false;

  /** ================= DEMO SCENARIOS (preview only) =================
      The whole caseload (roster, schedule, awaiting-activation list) swaps together so each
      scenario tells a coherent, realistic story instead of just changing a count. */
  private fewClients: any[] = [
    { client_id: 1, first_name: 'Maria', last_name: 'Gonzalez', city: 'Austin', tags: ['Anxiety', 'Sleep'], nextSessionDays: 3, nextSessionDate: 'Aug 6, 2026', pendingTasks: 1, moodTrend: 'up' as const, daysSinceLastActivity: 1, phq9: 4, gad7: 3, totalSessions: 8, overdueActivities: [] as OverdueActivity[], privacyCompliant: true, lastNoteSummary: 'Reported improved sleep after two weeks of consistent wind-down routine. Still avoiding group social settings — agreed to try one small gathering before next session.' },
    { client_id: 2, first_name: 'James', last_name: 'Carter', city: 'Denver', tags: ['Depression'], nextSessionDays: 10, nextSessionDate: 'Aug 13, 2026', pendingTasks: 3, moodTrend: 'down' as const, daysSinceLastActivity: 6, phq9: 19, gad7: 14, totalSessions: 5, privacyCompliant: true, lastNoteSummary: 'Low energy, missed two workdays. Introduced behavioral activation homework — client was hesitant but agreed to try one activity this week.', overdueActivities: [
      { id: 21, name: 'Cognitive reframing worksheet', daysOverdue: 4, resolved: false },
      { id: 22, name: 'GAD-7 Self-Assessment', daysOverdue: 2, resolved: false },
    ] },
    { client_id: 3, first_name: 'Priya', last_name: 'Nair', city: 'Seattle', tags: ['Stress Management', 'Grief'], nextSessionDays: 1, nextSessionDate: 'Aug 4, 2026', pendingTasks: 2, moodTrend: 'down' as const, daysSinceLastActivity: 2, phq9: 9, gad7: 8, totalSessions: 12, overdueActivities: [] as OverdueActivity[], privacyCompliant: false, lastNoteSummary: 'One-year anniversary of loss approaching next month — flagged as a likely difficult period. Continuing grief processing work at client\'s pace.' },
    { client_id: 6, first_name: 'Derek', last_name: 'Osei', city: 'Boston', tags: ['Trauma', 'Sleep'], nextSessionDays: 5, nextSessionDate: 'Aug 8, 2026', pendingTasks: 4, moodTrend: 'down' as const, daysSinceLastActivity: 9, phq9: 22, gad7: 17, totalSessions: 3, privacyCompliant: true, lastNoteSummary: 'Sleep still severely disrupted, nightmares 4-5x/week. Discussed grounding techniques. Safety plan reviewed and remains current.', overdueActivities: [
      { id: 61, name: 'Daily mood journal', daysOverdue: 6, resolved: false },
      { id: 62, name: 'Sleep hygiene checklist', daysOverdue: 3, resolved: false },
      { id: 63, name: 'PHQ-9 Self-Assessment', daysOverdue: 9, resolved: false },
    ] },
    { client_id: 7, first_name: 'Sofia', last_name: 'Delgado', city: 'Miami', tags: ['Anxiety'], nextSessionDays: 14, nextSessionDate: 'Aug 17, 2026', pendingTasks: 0, moodTrend: 'up' as const, daysSinceLastActivity: 0, phq9: 2, gad7: 1, totalSessions: 20, overdueActivities: [] as OverdueActivity[], privacyCompliant: false, lastNoteSummary: 'Consistently applying coping strategies. Discussed reducing session frequency to biweekly going forward.' },
  ];

  private fewInactive: any[] = [
    { client_id: 4, first_name: 'Tom', last_name: 'Alvarez', city: 'Miami', nextSessionDays: null as number | null, activationExpired: false, checked: false },
    { client_id: 5, first_name: 'Linda', last_name: 'Brooks', city: 'Chicago', nextSessionDays: null as number | null, activationExpired: true, checked: false },
  ];

  private manyClients: any[] = [
    ...this.fewClients,
    { client_id: 8, first_name: 'Ethan', last_name: 'Walsh', city: 'Chicago', tags: ['Anxiety'], nextSessionDays: 2, nextSessionDate: 'Aug 12, 2026', pendingTasks: 1, moodTrend: 'flat' as const, daysSinceLastActivity: 3, phq9: 6, gad7: 7, totalSessions: 4, overdueActivities: [] as OverdueActivity[], privacyCompliant: true, lastNoteSummary: 'Settling into a regular check-in rhythm. No major concerns this week.' },
    { client_id: 9, first_name: 'Grace', last_name: 'Kim', city: 'Portland', tags: ['Sleep', 'Stress Management'], nextSessionDays: 6, nextSessionDate: 'Aug 16, 2026', pendingTasks: 2, moodTrend: 'up' as const, daysSinceLastActivity: 2, phq9: 7, gad7: 6, totalSessions: 11, overdueActivities: [] as OverdueActivity[], privacyCompliant: true, lastNoteSummary: 'Sleep tracker shows steady improvement over the last three weeks.' },
    { client_id: 10, first_name: 'Marcus', last_name: 'Bennett', city: 'Phoenix', tags: ['Depression', 'Trauma'], nextSessionDays: 4, nextSessionDate: 'Aug 14, 2026', pendingTasks: 5, moodTrend: 'down' as const, daysSinceLastActivity: 8, phq9: 21, gad7: 16, totalSessions: 6, privacyCompliant: true, lastNoteSummary: 'Withdrawn in last session, minimal engagement with homework. Safety plan reviewed as a precaution.', overdueActivities: [
      { id: 101, name: 'Daily mood journal', daysOverdue: 5, resolved: false },
      { id: 102, name: 'PHQ-9 Self-Assessment', daysOverdue: 3, resolved: false },
    ] },
    { client_id: 11, first_name: 'Nadia', last_name: 'Farouk', city: 'Houston', tags: ['Grief'], nextSessionDays: 9, nextSessionDate: 'Aug 19, 2026', pendingTasks: 0, moodTrend: 'flat' as const, daysSinceLastActivity: 4, phq9: 8, gad7: 5, totalSessions: 15, overdueActivities: [] as OverdueActivity[], privacyCompliant: true, lastNoteSummary: 'Approaching things with more acceptance lately. Continuing at a steady pace.' },
    { client_id: 12, first_name: 'Lucas', last_name: 'Alvarez', city: 'San Diego', tags: ['Anxiety', 'Sleep'], nextSessionDays: 7, nextSessionDate: 'Aug 17, 2026', pendingTasks: 3, moodTrend: 'down' as const, daysSinceLastActivity: 7, phq9: 13, gad7: 12, totalSessions: 2, privacyCompliant: false, lastNoteSummary: 'New client, second session. Still establishing baseline and rapport.', overdueActivities: [
      { id: 121, name: 'GAD-7 Self-Assessment', daysOverdue: 2, resolved: false },
    ] },
    { client_id: 13, first_name: 'Fatima', last_name: 'Rahman', city: 'Dallas', tags: ['Stress Management'], nextSessionDays: 11, nextSessionDate: 'Aug 21, 2026', pendingTasks: 1, moodTrend: 'up' as const, daysSinceLastActivity: 1, phq9: 5, gad7: 4, totalSessions: 9, overdueActivities: [] as OverdueActivity[], privacyCompliant: true, lastNoteSummary: 'Work stress easing after a project deadline passed. Coping strategies holding up well.' },
    { client_id: 14, first_name: 'Noah', last_name: 'Peterson', city: 'Atlanta', tags: ['Depression'], nextSessionDays: 3, nextSessionDate: 'Aug 13, 2026', pendingTasks: 2, moodTrend: 'flat' as const, daysSinceLastActivity: 5, phq9: 11, gad7: 9, totalSessions: 7, overdueActivities: [] as OverdueActivity[], privacyCompliant: true, lastNoteSummary: 'Mood holding steady, low but not declining. Continuing current treatment plan.' },
    { client_id: 15, first_name: 'Zara', last_name: 'Whitfield', city: 'Minneapolis', tags: ['Trauma'], nextSessionDays: 8, nextSessionDate: 'Aug 18, 2026', pendingTasks: 0, moodTrend: 'up' as const, daysSinceLastActivity: 3, phq9: 10, gad7: 8, totalSessions: 13, overdueActivities: [] as OverdueActivity[], privacyCompliant: true, lastNoteSummary: 'Good progress with grounding techniques. Nightmares down to about once a week.' },
    { client_id: 16, first_name: 'Omar', last_name: 'Nakamura', city: 'San Francisco', tags: ['Anxiety'], nextSessionDays: 5, nextSessionDate: 'Aug 15, 2026', pendingTasks: 4, moodTrend: 'down' as const, daysSinceLastActivity: 6, phq9: 14, gad7: 15, totalSessions: 4, privacyCompliant: true, lastNoteSummary: 'Anxiety spiking around an upcoming work presentation. Practicing exposure exercises.', overdueActivities: [
      { id: 161, name: 'Breathing exercise', daysOverdue: 4, resolved: false },
    ] },
    { client_id: 17, first_name: 'Lily', last_name: 'Dubois', city: 'Nashville', tags: ['Sleep'], nextSessionDays: 12, nextSessionDate: 'Aug 22, 2026', pendingTasks: 1, moodTrend: 'up' as const, daysSinceLastActivity: 2, phq9: 3, gad7: 2, totalSessions: 18, overdueActivities: [] as OverdueActivity[], privacyCompliant: true, lastNoteSummary: 'Sleep hygiene changes are sticking. Considering stepping down session frequency.' },
  ];

  private manyInactive: any[] = [
    ...this.fewInactive,
    { client_id: 18, first_name: 'Priya', last_name: 'Chandran', city: 'Newark', nextSessionDays: null as number | null, activationExpired: false, checked: false },
  ];

  demoScenarios = [
    { key: 'empty', label: 'New Therapist · 0 Clients' },
    { key: 'few', label: 'Growing Practice · 5 Clients' },
    { key: 'many', label: 'Busy Practice · 15 Clients' },
  ];

  activeScenario = this.demoScenarios[1];

  applyScenario(): void {
    const key = this.activeScenario.key;
    if (key === 'empty') {
      this._realActiveClients = [];
      this.inactiveClients = [];
    } else if (key === 'many') {
      this._realActiveClients = this.manyClients;
      this.inactiveClients = this.manyInactive;
    } else {
      this._realActiveClients = this.fewClients;
      this.inactiveClients = this.fewInactive;
    }
    this.selectedClient = null;
    this.selectedTag = null;
    this.searchClient = '';
    this.currentPage = 'clients';
  }

  /** Two lightweight example clients (with a couple of sample activities each, in
      clientActivityMap below) shown in place of a bare empty state on a brand-new
      therapist's first login, purely so they can see what an active caseload looks
      and feels like. They vanish automatically the moment a real client exists -
      see the activeClients getter - no separate "dismiss" state needed. Their scores/
      signals are deliberately picked so ONE lands in Safety & Clinical Alerts and the
      OTHER in Recent Interaction Alerts, so both dashboard sections (not just the
      plain roster) actually render something during this walkthrough. */
  private sampleClients: any[] = [
    { client_id: 9001, first_name: 'Alex', last_name: 'Rivera', city: 'Sample City', tags: ['Anxiety'], nextSessionDays: 3, nextSessionDate: 'Aug 12, 2026', pendingTasks: 1, moodTrend: 'flat' as const, daysSinceLastActivity: 3, phq9: 17, gad7: 9, totalSessions: 4, overdueActivities: [{ id: 90011, name: 'Daily mood journal', daysOverdue: 3, resolved: false }] as OverdueActivity[], privacyCompliant: true, lastNoteSummary: 'This is a sample client so you can see what a caseload looks like. Add your first real client to replace it.', isSample: true },
    { client_id: 9002, first_name: 'Jordan', last_name: 'Lee', city: 'Sample City', tags: ['Sleep'], nextSessionDays: 7, nextSessionDate: 'Aug 16, 2026', pendingTasks: 2, moodTrend: 'up' as const, daysSinceLastActivity: 8, phq9: 4, gad7: 3, totalSessions: 9, overdueActivities: [] as OverdueActivity[], privacyCompliant: true, lastNoteSummary: 'This is a sample client so you can see what a caseload looks like. Add your first real client to replace it.', isSample: true },
  ];

  private _realActiveClients: any[] = this.fewClients;

  get activeClients(): any[] {
    return this._realActiveClients.length ? this._realActiveClients : this.sampleClients;
  }

  set activeClients(value: any[]) {
    this._realActiveClients = value;
  }

  get isShowingSampleClients(): boolean {
    return !this._realActiveClients.length;
  }

  lastActivityLabel(days: number): string {
    if (days <= 0) { return 'Today'; }
    if (days === 1) { return 'Yesterday'; }
    return `${days} days ago`;
  }

  clientOf(clientId: number) {
    return this.activeClients.find(c => c.client_id === clientId);
  }

  /** The client currently under the mouse, for the hover cards below (both share one instance per card type). */
  hoveredClient: any = null;

  unresolvedOverdue(client: { overdueActivities: OverdueActivity[] }): OverdueActivity[] {
    return client.overdueActivities.filter(a => !a.resolved);
  }

  overdueCountOf(client: { overdueActivities: OverdueActivity[] }): number {
    return this.unresolvedOverdue(client).length;
  }

  resolveOverdueActivity(client: { first_name: string }, activity: OverdueActivity): void {
    activity.resolved = true;
    this.messageService.add({ severity: 'success', summary: 'Marked as followed up', detail: `${activity.name} (preview only).` });
  }

  /** Standard PHQ-9 severity bands, mapped onto the same 3-tier color language as task urgency. */
  phqBand(score: number): { label: string; tier: 'good' | 'monitor' | 'attention' } {
    if (score >= 20) { return { label: 'Severe', tier: 'attention' }; }
    if (score >= 15) { return { label: 'Mod. Severe', tier: 'attention' }; }
    if (score >= 10) { return { label: 'Moderate', tier: 'monitor' }; }
    if (score >= 5) { return { label: 'Mild', tier: 'good' }; }
    return { label: 'Minimal', tier: 'good' };
  }

  /** Standard GAD-7 severity bands, same 3-tier mapping. */
  gadBand(score: number): { label: string; tier: 'good' | 'monitor' | 'attention' } {
    if (score >= 15) { return { label: 'Severe', tier: 'attention' }; }
    if (score >= 10) { return { label: 'Moderate', tier: 'monitor' }; }
    if (score >= 5) { return { label: 'Mild', tier: 'good' }; }
    return { label: 'Minimal', tier: 'good' };
  }

  /**
   * Clinical risk (from assessment scores) is deliberately a SEPARATE axis from task urgency
   * (severityOf/overdueActivityClients below, which is purely overdue/pending activities). A
   * client who forgot their journaling homework and a client with a severe PHQ-9 score should
   * never look the same at a glance - clinical risk gets its own dedicated alert section instead
   * of sharing the routine "needs attention" roster treatment.
   */
  clinicalRiskOf(client: { phq9: number; gad7: number }): 'safety' | 'watch' | 'stable' {
    const worseTier = [this.phqBand(client.phq9).tier, this.gadBand(client.gad7).tier];
    if (worseTier.includes('attention')) { return 'safety'; }
    if (worseTier.includes('monitor')) { return 'watch'; }
    return 'stable';
  }

  get safetyAlertClients() {
    return this.activeClients.filter(c => this.clinicalRiskOf(c) === 'safety');
  }

  /**
   * A second, independent alert lens: engagement/mood signals from recent interactions,
   * not clinical scores. A client can land here without ever qualifying for a Safety &
   * Clinical Alert (e.g. Priya below - mild scores, but a declining mood trend) - the two
   * are deliberately separate axes, same as clinical risk vs. task urgency above.
   */
  interactionAlertOf(client: { moodTrend: string; daysSinceLastActivity: number }): boolean {
    return client.moodTrend === 'down' || client.daysSinceLastActivity >= 7;
  }

  get interactionAlertClients() {
    return this.activeClients.filter(c => this.interactionAlertOf(c));
  }

  interactionReasonOf(client: { moodTrend: string; daysSinceLastActivity: number }): string {
    const reasons: string[] = [];
    if (client.moodTrend === 'down') { reasons.push('Mood declining'); }
    if (client.daysSinceLastActivity >= 7) { reasons.push(`No activity in ${client.daysSinceLastActivity} days`); }
    return reasons.join(' · ');
  }

  get pendingComplianceClients() {
    return this.activeClients.filter(c => !c.privacyCompliant);
  }

  /** Total admin items behind the bell icon - privacy-policy pending + activation pending. */
  get notificationCount(): number {
    return this.pendingComplianceClients.length + this.inactiveClients.length;
  }

  /** ================= NOTIFICATIONS (standalone page, preview only) =================
      Distinct from the bell overlay above - the real app also has a full page at /notifications
      with a Messages/Activities toggle, tag filtering, sorting, bulk-select, and Clear. Client
      IDs below exist in both the "few" and "many" scenarios, so this works under either. */
  mockNotifications: any[] = [
    { id: 1, type: 'Messages', clientId: 1, text: 'sent you a new message', detail: '"Had a rough night, couldn\'t sleep much."', time: '9:12 AM', checked: false },
    { id: 2, type: 'Activities', clientId: 2, text: 'completed an activity', detail: 'Sleep hygiene checklist', time: 'Yesterday', checked: false },
    { id: 3, type: 'Messages', clientId: 3, text: 'sent you a new message', detail: '"Okay, see you at 11."', time: '2 days ago', checked: false },
    { id: 4, type: 'Activities', clientId: 6, text: 'has overdue activities', detail: 'Daily mood journal, Sleep hygiene checklist, PHQ-9 Self-Assessment', time: '3 days ago', checked: false },
    { id: 5, type: 'Messages', clientId: 7, text: 'sent you a new message', detail: '"Feeling good about this week."', time: '4 days ago', checked: false },
  ];

  notificationTypeFilter: 'Messages' | 'Activities' = 'Messages';
  notificationTagFilter: string | null = null;
  notificationSortDescending = true;
  notificationSelectAll = false;

  get filteredNotifications(): any[] {
    return this.mockNotifications
      .filter(n => n.type === this.notificationTypeFilter)
      .filter(n => !this.notificationTagFilter || (this.clientOf(n.clientId)?.tags || []).includes(this.notificationTagFilter as string))
      .sort((a, b) => this.notificationSortDescending ? b.id - a.id : a.id - b.id);
  }

  toggleSelectAllNotifications(): void {
    this.filteredNotifications.forEach(n => n.checked = this.notificationSelectAll);
  }

  clearCheckedNotifications(): void {
    const checkedIds = new Set(this.mockNotifications.filter(n => n.checked).map(n => n.id));
    if (!checkedIds.size) { return; }
    this.mockNotifications = this.mockNotifications.filter(n => !checkedIds.has(n.id));
    this.notificationSelectAll = false;
    this.messageService.add({ severity: 'success', summary: 'Cleared', detail: 'Preview only.' });
  }

  notificationAction(n: any): void {
    const client = this.clientOf(n.clientId);
    if (client) { this.goToClient(client); }
  }

  /**
   * Clients already covered by the Safety & Clinical Alerts section above are deliberately
   * excluded from all three Triage roster buckets below - otherwise a clinically-flagged
   * client who's also behind on homework would show up twice on the same screen (once as
   * a Safety Alert, once again under "Overdue Activities"), reading as redundant even
   * though the two are tracking genuinely different things.
   */
  get triageRosterPool() {
    const safetyIds = new Set(this.safetyAlertClients.map(c => c.client_id));
    return this.activeClients.filter(c => !safetyIds.has(c.client_id));
  }

  get overdueActivityClients() {
    return this.triageRosterPool.filter(c => this.overdueCountOf(c) > 0);
  }

  get monitorClients() {
    return this.triageRosterPool.filter(c => this.overdueCountOf(c) === 0 && c.pendingTasks >= 2);
  }

  get onTrackClients() {
    return this.triageRosterPool.filter(c => this.overdueCountOf(c) === 0 && c.pendingTasks < 2);
  }

  get totalPendingTasks(): number {
    return this.activeClients.reduce((sum, c) => sum + c.pendingTasks, 0);
  }

  severityOf(client: { overdueActivities: OverdueActivity[]; pendingTasks: number }): 'attention' | 'monitor' | 'good' {
    if (this.overdueCountOf(client) > 0) { return 'attention'; }
    if (client.pendingTasks >= 2) { return 'monitor'; }
    return 'good';
  }

  inactiveClients: any[] = this.fewInactive;

  get tagList(): string[] {
    const allTags = this.activeClients.reduce((acc: string[], c) => acc.concat(c.tags), []);
    return Array.from(new Set(allTags));
  }

  get filteredActiveClients() {
    return this.activeClients.filter(c => {
      const matchesSearch = !this.searchClient.trim() ||
        (c.first_name + ' ' + c.last_name).toLowerCase().includes(this.searchClient.trim().toLowerCase());
      const matchesTag = !this.selectedTag || c.tags.includes(this.selectedTag);
      return matchesSearch && matchesTag;
    }).sort((a, b) => this.isDescending ? b.client_id - a.client_id : a.client_id - b.client_id);
  }

  selectTag(tag: string | null): void {
    this.selectedTag = tag;
  }

  toggleSelectAll(checked: boolean): void {
    this.isSelectAll = checked;
    this.inactiveClients.forEach(c => c.checked = checked);
  }

  updateSelectAll(): void {
    this.isSelectAll = this.inactiveClients.every(c => c.checked);
  }

  remindAll(): void {
    this.messageService.add({ severity: 'success', summary: 'Reminders sent', detail: 'Preview only — no emails were sent.' });
  }

  regenerateCode(client: any): void {
    client.activationExpired = false;
    this.messageService.add({ severity: 'success', summary: 'Code regenerated', detail: `New activation code issued for ${client.first_name} (preview only).` });
  }

  goToClient(client: any): void {
    this.selectedClient = client;
    this.clientDetailType = 'Activities';
    this.currentPage = 'client-details';
  }

  /** ================= ADD CLIENT (preview only) =================
      Mirrors the real form's fields: name/email/phone/city, up to 4 purpose-of-visit tags,
      and a chat-activation checkbox. Submitting creates the client, then heads straight into
      the (simplified, new-client) Add Activity flow - same as the real app's onboarding path. */
  newClientForm = {
    firstName: '', lastName: '', email: '', phone: '', city: '',
    povList: [] as string[],
    povInput: '',
    chatActive: true,
  };

  povSuggestions = ['Anxiety', 'Depression', 'Stress Management', 'Grief', 'Trauma', 'Sleep Issues', 'Relationship Issues'];
  newClientError: string | null = null;

  openAddClient(): void {
    this.newClientForm = { firstName: '', lastName: '', email: '', phone: '', city: '', povList: [], povInput: '', chatActive: true };
    this.newClientError = null;
    this.currentPage = 'add-client';
  }

  addPovToNewClient(): void {
    const val = this.newClientForm.povInput.trim();
    if (!val || this.newClientForm.povList.length >= 4 || this.newClientForm.povList.includes(val)) { return; }
    this.newClientForm.povList.push(val);
    this.newClientForm.povInput = '';
  }

  removePovFromNewClient(tag: string): void {
    this.newClientForm.povList = this.newClientForm.povList.filter(t => t !== tag);
  }

  cancelAddClient(): void {
    this.currentPage = 'clients';
  }

  submitNewClient(): void {
    const f = this.newClientForm;
    if (!f.firstName.trim() || !f.lastName.trim() || !f.email.trim()) {
      this.newClientError = 'First name, last name, and email are required.';
      return;
    }
    this.newClientError = null;
    const allIds = [...this.fewClients, ...this.manyClients].map(c => c.client_id);
    const newClient: any = {
      client_id: Math.max(...allIds) + 1, first_name: f.firstName.trim(), last_name: f.lastName.trim(),
      city: f.city.trim() || 'Unknown', tags: [...f.povList],
      nextSessionDays: null, nextSessionDate: '—', pendingTasks: 0,
      moodTrend: 'flat', daysSinceLastActivity: 0, phq9: 0, gad7: 0, totalSessions: 0,
      overdueActivities: [] as OverdueActivity[], privacyCompliant: true, lastNoteSummary: 'No sessions yet.',
    };
    this._realActiveClients = [...this._realActiveClients, newClient];
    this.selectedClient = newClient;
    this.messageService.add({ severity: 'success', summary: 'Client added', detail: `${newClient.first_name} ${newClient.last_name} was added (preview only).` });
    this.addActivityIsNewClient = true;
    this.openAddActivity();
  }

  backToClients(): void {
    this.currentPage = 'clients';
  }

  /** ================= SITE MAP (preview only) =================
      A few pages need a selected client/activity to render meaningfully - these give the
      site map's direct-jump links a sensible one to preview against, and a graceful message
      instead of a blank page when the current scenario has zero clients. */
  private needAnyClientOrWarn(): any {
    const client = this.activeClients[0];
    if (!client) {
      this.messageService.add({ severity: 'info', summary: 'No clients in this scenario', detail: 'Switch the Scenario dropdown to one with clients first.' });
    }
    return client;
  }

  previewClientDetails(): void {
    const client = this.needAnyClientOrWarn();
    if (client) { this.goToClient(client); }
  }

  previewActivityDetails(): void {
    const client = this.activeClients.find((c: any) => c.client_id === 2) || this.needAnyClientOrWarn();
    if (!client) { return; }
    this.selectedClient = client;
    const activity = this.allClientActivities[0];
    if (activity) {
      this.openActivity(activity);
    } else {
      this.goToClient(client);
      this.messageService.add({ severity: 'info', summary: 'No activities yet', detail: 'This client has none to preview - showing Client Details instead.' });
    }
  }

  previewAddActivity(): void {
    const client = this.needAnyClientOrWarn();
    if (!client) { return; }
    this.selectedClient = client;
    this.addActivityIsNewClient = false;
    this.openAddActivity();
  }

  previewNewClientAddActivity(): void {
    const client = this.needAnyClientOrWarn();
    if (!client) { return; }
    this.selectedClient = client;
    this.addActivityIsNewClient = true;
    this.openAddActivity();
  }

  /** ================= CLIENT DETAILS (preview only) =================
      Everything below mirrors the real client-details screen's functional sections
      (activities by status, PHQ-9/GAD-7 history, mood/score trend, interactions chat,
      progress comments) with one shared mock dataset - the content doesn't change per
      client since this is a look-and-feel preview, not wired to real data. */
  selectedClient: any = null;
  clientDetailType: 'Activities' | 'Progress' = 'Activities';
  clientDetailTypeOptions = ['Activities', 'Progress'];
  selectedSessionLabel = 'Session 3 (current)';
  showDeleteClientDialog = false;
  showEditSessionDialog = false;

  /** ================= PER-CLIENT ACTIVITY DATA (preview only) =================
      Keyed by client_id, lazily created on first access - so a client with no entry yet
      (most of the roster) genuinely has zero activities rather than sharing one global mock
      set. James (many activities), Maria (a few), and Sofia (none, no entry at all) are the
      three deliberately curated examples; everyone else defaults to the empty case too. */
  private clientActivityMap: { [clientId: number]: any[] } = {
    2: [ // James Carter - "many activities" example
      { label: 'In-progress Activities', activities: [
        { name: 'Daily mood journal', great: 4, good: 2, bad: 1, type: 'Other', deadline: 'Aug 13, 2026', recurrence: 'Everyday',
          description: 'Log your mood once a day, morning or evening, whichever feels natural.', videoLinks: [] as { label: string; url: string }[],
          trend: [
            { name: 'Week 1', series: [{ name: 'Great', value: 1 }, { name: 'Okay', value: 1 }, { name: 'Difficult', value: 0 }] },
            { name: 'Week 2', series: [{ name: 'Great', value: 3 }, { name: 'Okay', value: 1 }, { name: 'Difficult', value: 1 }] },
          ],
          comments: [
            { date: 'Aug 4, 2026', tag: 'GREAT', text: 'Felt steady today, energy was good after the morning walk.' },
            { date: 'Aug 2, 2026', tag: 'GOOD', text: 'Okay day, a bit tired but nothing major.' },
            { date: 'Jul 30, 2026', tag: 'BAD', text: 'Rough morning, anxious about the upcoming review at work.' },
          ] },
        { name: 'Breathing exercise', great: 2, good: 3, bad: 0, type: 'Other', deadline: 'Aug 10, 2026', recurrence: 'Every 2 Days',
          description: '5 minutes of box breathing before bed.',
          videoLinks: [{ label: 'Box breathing walkthrough', url: 'https://example.com/videos/box-breathing' }],
          trend: [
            { name: 'Week 1', series: [{ name: 'Great', value: 1 }, { name: 'Okay', value: 2 }, { name: 'Difficult', value: 0 }] },
            { name: 'Week 2', series: [{ name: 'Great', value: 1 }, { name: 'Okay', value: 1 }, { name: 'Difficult', value: 0 }] },
          ],
          comments: [
            { date: 'Aug 3, 2026', tag: 'GOOD', text: 'Helped me fall asleep faster.' },
          ] },
      ] },
      { label: 'Completed Activities', activities: [
        { name: 'Sleep hygiene checklist', great: 6, good: 1, bad: 0, type: 'Other', deadline: 'Jul 28, 2026', recurrence: 'One Time',
          description: 'Review and check off the sleep hygiene habits covered in session.', videoLinks: [] as { label: string; url: string }[],
          trend: [
            { name: 'Week 1', series: [{ name: 'Great', value: 3 }, { name: 'Okay', value: 1 }, { name: 'Difficult', value: 0 }] },
            { name: 'Week 2', series: [{ name: 'Great', value: 3 }, { name: 'Okay', value: 0 }, { name: 'Difficult', value: 0 }] },
          ],
          comments: [
            { date: 'Jul 28, 2026', tag: 'GREAT', text: 'Slept through the night for the first time in weeks.' },
          ] },
        { name: 'Gratitude log', great: 8, good: 0, bad: 0, type: 'Other', deadline: 'Jul 24, 2026', recurrence: 'Everyday',
          description: 'Write down three things you were grateful for today.', videoLinks: [] as { label: string; url: string }[],
          trend: [
            { name: 'Week 1', series: [{ name: 'Great', value: 4 }, { name: 'Okay', value: 0 }, { name: 'Difficult', value: 0 }] },
            { name: 'Week 2', series: [{ name: 'Great', value: 4 }, { name: 'Okay', value: 0 }, { name: 'Difficult', value: 0 }] },
          ],
          comments: [
            { date: 'Jul 24, 2026', tag: 'GREAT', text: 'Really enjoying this one, easy to keep up with.' },
          ] },
      ] },
      { label: 'Not Started', activities: [
        { name: 'Cognitive reframing worksheet', great: 0, good: 0, bad: 0, type: 'Other', deadline: 'Aug 20, 2026', recurrence: 'One Time',
          description: 'Work through the thought-record worksheet handed out in session.', videoLinks: [] as { label: string; url: string }[],
          trend: [] as { name: string; series: { name: string; value: number }[] }[],
          comments: [] as { date: string; tag: string; text: string }[] },
      ] },
    ],
    1: [ // Maria Gonzalez - "a few activities" example
      { label: 'In-progress Activities', activities: [
        { name: 'Gratitude log', great: 3, good: 1, bad: 0, type: 'Other', deadline: 'Aug 6, 2026', recurrence: 'Everyday',
          description: 'Write down three things you were grateful for today.', videoLinks: [] as { label: string; url: string }[],
          trend: [
            { name: 'Week 1', series: [{ name: 'Great', value: 2 }, { name: 'Okay', value: 1 }, { name: 'Difficult', value: 0 }] },
            { name: 'Week 2', series: [{ name: 'Great', value: 1 }, { name: 'Okay', value: 0 }, { name: 'Difficult', value: 0 }] },
          ],
          comments: [
            { date: 'Aug 5, 2026', tag: 'GREAT', text: 'Small wins today - noticed I felt calmer after the morning walk.' },
          ] },
      ] },
    ],
    9001: [ // Alex Rivera - sample client
      { label: 'In-progress Activities', activities: [
        { name: 'Daily mood journal', great: 2, good: 1, bad: 1, type: 'Other', deadline: 'Aug 12, 2026', recurrence: 'Everyday',
          description: 'Log your mood once a day, morning or evening, whichever feels natural.', videoLinks: [] as { label: string; url: string }[],
          trend: [
            { name: 'Week 1', series: [{ name: 'Great', value: 1 }, { name: 'Okay', value: 1 }, { name: 'Difficult', value: 1 }] },
          ],
          comments: [
            { date: 'Aug 9, 2026', tag: 'OKAY', text: 'Sample comment - this is what a client check-in looks like.' },
          ] },
      ] },
    ],
    9002: [ // Jordan Lee - sample client
      { label: 'Completed Activities', activities: [
        { name: 'Sleep hygiene checklist', great: 5, good: 1, bad: 0, type: 'Other', deadline: 'Aug 2, 2026', recurrence: 'One Time',
          description: 'Review and check off the sleep hygiene habits covered in session.', videoLinks: [] as { label: string; url: string }[],
          trend: [
            { name: 'Week 1', series: [{ name: 'Great', value: 3 }, { name: 'Okay', value: 1 }, { name: 'Difficult', value: 0 }] },
          ],
          comments: [
            { date: 'Aug 2, 2026', tag: 'GREAT', text: 'Sample comment - this is what a completed activity looks like.' },
          ] },
      ] },
    ],
  };

  get clientActivityGroups(): any[] {
    const id = this.selectedClient?.client_id;
    if (id == null) { return []; }
    if (!this.clientActivityMap[id]) { this.clientActivityMap[id] = []; }
    return this.clientActivityMap[id];
  }

  get allClientActivities(): any[] {
    return this.clientActivityGroups.reduce((list: any[], g: any) => list.concat(
      g.activities.map((a: any) => ({ ...a, groupLabel: g.label })),
    ), [] as any[]);
  }

  /** ================= ACTIVITY DETAILS (preview only) ================= */
  selectedActivity: any = null;
  activityCommentFilterTag: 'GREAT' | 'GOOD' | 'BAD' = 'GREAT';
  showDeleteActivityDialog = false;

  openActivity(activity: any): void {
    this.selectedActivity = activity;
    this.activityCommentFilterTag = 'GREAT';
    this.currentPage = 'activity-details';
  }

  /** ================= EDIT EXISTING ACTIVITY (preview only) =================
      The real ClientAddActivitySessionComponent doubles as an edit form for an activity
      that's already been shared - reuses the exact same Add Activity form fields/state,
      just pre-filled, with the catalog/bucket side panel hidden and an Update button
      instead of Add To Bucket/Share, since there's nothing to queue - just one activity
      being changed in place. */
  editingActivityMode = false;

  editExistingActivity(): void {
    if (!this.selectedActivity) { return; }
    const a = this.selectedActivity;
    this.editingActivityMode = true;
    this.addActivityIsNewClient = false;
    const recurrenceUnitMatch = /Days|Weeks|Months/.exec(a.recurrence || '');
    const recurrenceValueMatch = /\d+/.exec(a.recurrence || '');
    this.activityForm = {
      name: a.name,
      description: a.description,
      typeId: this.activityTypeOptions.find(t => t.name === a.type)?.id || 1,
      deadlineMode: (a.deadline || '').startsWith('Next Session') ? 'session' : 'date',
      deadlineDate: null,
      recurrenceMode: a.recurrence === 'Everyday' ? 'everyday' : a.recurrence === 'One time' ? 'one-time' : 'custom',
      recurrenceUnit: (recurrenceUnitMatch ? recurrenceUnitMatch[0] : 'Days') as 'Days' | 'Weeks' | 'Months',
      recurrenceValue: recurrenceValueMatch ? parseInt(recurrenceValueMatch[0], 10) : 1,
      videoLinks: [...(a.videoLinks || [])],
    };
    this.currentPage = 'add-activity';
  }

  updateExistingActivity(): void {
    if (!this.activityForm.name.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Activity name required', detail: 'Enter a name before updating.' });
      return;
    }
    const a = this.selectedActivity;
    a.name = this.activityForm.name.trim();
    a.description = this.activityForm.description.trim();
    a.type = this.activityTypeName(this.activityForm.typeId);
    a.deadline = this.deadlineLabel(this.activityForm);
    a.recurrence = this.recurrenceLabel(this.activityForm);
    a.videoLinks = [...this.activityForm.videoLinks];
    this.messageService.add({ severity: 'success', summary: 'Activity updated', detail: 'Preview only.' });
    this.editingActivityMode = false;
    this.activityForm = this.newActivityForm();
    this.currentPage = 'activity-details';
  }

  cancelEditActivity(): void {
    this.editingActivityMode = false;
    this.activityForm = this.newActivityForm();
    this.currentPage = 'activity-details';
  }

  backToClientDetails(): void {
    this.currentPage = 'client-details';
  }

  get selectedActivityIndex(): number {
    return this.allClientActivities.findIndex(a => a.name === this.selectedActivity?.name);
  }

  navActivity(delta: number): void {
    const list = this.allClientActivities;
    const next = this.selectedActivityIndex + delta;
    if (next >= 0 && next < list.length) { this.selectedActivity = list[next]; }
  }

  get filteredActivityComments() {
    return (this.selectedActivity?.comments || []).filter((c: any) => c.tag === this.activityCommentFilterTag);
  }

  /** ================= ADD ACTIVITY (preview only) =================
      Mirrors the real screen's "bucket" pattern: fill a form, queue one or more
      activities into a bucket, review/edit/remove queued items, then submit the
      whole batch at once (or the "New Session" variant, which adds session dates
      on top of the same form). */
  activityTypeOptions = [
    { id: 1, name: 'Other' },
    { id: 2, name: 'PHQ-9' },
    { id: 3, name: 'GAD-7' },
  ];

  activityBucket: any[] = [];
  showBucketConfirmDialog = false;
  videoLabelInput = '';
  videoUrlInput = '';

  /** A curated library of common activities the therapist can start from instead of typing
      one from scratch every time - clicking one just pre-fills name/description/type, the
      rest of the form (deadline, recurrence, videos) stays whatever's already set. */
  standardActivityCatalog = [
    { name: 'Daily mood journal', typeId: 1, description: 'Log your mood once a day to track emotional patterns over time.' },
    { name: 'Breathing exercise', typeId: 1, description: '5 minutes of guided breathing to reduce anxiety in the moment.' },
    { name: 'Sleep hygiene checklist', typeId: 1, description: 'A nightly checklist of habits that support consistent, restful sleep.' },
    { name: 'Gratitude log', typeId: 1, description: 'Write down three things you were grateful for today.' },
    { name: 'Cognitive reframing worksheet', typeId: 1, description: 'Identify a difficult thought and practice reframing it constructively.' },
    { name: 'Thought record', typeId: 1, description: 'Track triggering situations, automatic thoughts, and alternative responses.' },
    { name: 'Behavioral activation log', typeId: 1, description: 'Plan and track one meaningful or enjoyable activity each day.' },
    { name: 'PHQ-9 Self-Assessment', typeId: 2, description: 'Standard 9-item depression screening questionnaire.' },
    { name: 'GAD-7 Self-Assessment', typeId: 3, description: 'Standard 7-item anxiety screening questionnaire.' },
  ];

  selectedCatalogItem: { name: string; description: string; typeId: number } | null = null;

  useStandardActivity(item: { name: string; description: string; typeId: number } | null): void {
    if (!item) { return; }
    this.activityForm.name = item.name;
    this.activityForm.description = item.description;
    this.activityForm.typeId = item.typeId;
  }

  newActivityForm() {
    return {
      name: '',
      description: '',
      typeId: 1,
      deadlineMode: 'session' as 'date' | 'session',
      deadlineDate: null as Date | null,
      recurrenceMode: 'one-time' as 'one-time' | 'everyday' | 'custom',
      recurrenceUnit: 'Days' as 'Days' | 'Weeks' | 'Months',
      recurrenceValue: 1,
      videoLinks: [] as { label: string; url: string }[],
    };
  }

  activityForm = this.newActivityForm();

  /** True when this Add Activity visit came from the Add Client wizard - the real app's
      TherapistAddActivityComponent is a thinner variant for a brand-new client: no "Already
      Assigned" history to speak of, and the footer reads Skip/Finish instead of Cancel/Share,
      finishing back at the dashboard rather than back at Client Details. */
  addActivityIsNewClient = false;

  openAddActivity(): void {
    this.editingActivityMode = false;
    this.activityForm = this.newActivityForm();
    this.activityBucket = [];
    this.videoLabelInput = '';
    this.videoUrlInput = '';
    this.selectedCatalogItem = null;
    this.currentPage = 'add-activity';
  }

  leaveAddActivity(): void {
    this.clientDetailType = 'Activities';
    this.currentPage = this.addActivityIsNewClient ? 'clients' : 'client-details';
    this.addActivityIsNewClient = false;
  }

  formatMockDate(d: Date | null): string {
    return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  }

  deadlineLabel(form: { deadlineMode: 'date' | 'session'; deadlineDate: Date | null }): string {
    if (form.deadlineMode === 'session') {
      return this.selectedClient?.nextSessionDate ? `Next Session (${this.selectedClient.nextSessionDate})` : 'Next Session';
    }
    return form.deadlineDate ? this.formatMockDate(form.deadlineDate) : 'No date set';
  }

  recurrenceLabel(form: { recurrenceMode: 'one-time' | 'everyday' | 'custom'; recurrenceUnit: string; recurrenceValue: number }): string {
    if (form.recurrenceMode === 'everyday') { return 'Everyday'; }
    if (form.recurrenceMode === 'custom') { return `Every ${form.recurrenceValue} ${form.recurrenceUnit}`; }
    return 'One time';
  }

  activityTypeName(id: number): string {
    return this.activityTypeOptions.find(t => t.id === id)?.name || 'Other';
  }

  addVideoLinkToForm(): void {
    if (!this.videoUrlInput.trim()) { return; }
    this.activityForm.videoLinks.push({ label: this.videoLabelInput.trim(), url: this.videoUrlInput.trim() });
    this.videoLabelInput = '';
    this.videoUrlInput = '';
  }

  removeVideoLinkFromForm(i: number): void {
    this.activityForm.videoLinks.splice(i, 1);
  }

  addToBucket(): void {
    if (!this.activityForm.name.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Activity name required', detail: 'Enter a name before adding it to the bucket.' });
      return;
    }
    this.activityBucket.push({ ...this.activityForm, videoLinks: [...this.activityForm.videoLinks] });
    this.activityForm = this.newActivityForm();
    this.videoLabelInput = '';
    this.videoUrlInput = '';
    this.selectedCatalogItem = null;
  }

  editBucketItem(i: number): void {
    const item = this.activityBucket[i];
    this.activityForm = { ...item, videoLinks: [...item.videoLinks] };
    this.activityBucket.splice(i, 1);
  }

  removeBucketItem(i: number): void {
    this.activityBucket.splice(i, 1);
  }

  shareActivities(): void {
    if (!this.activityBucket.length) { return; }
    const newActivities = this.activityBucket.map(item => ({
      name: item.name, great: 0, good: 0, bad: 0,
      type: this.activityTypeName(item.typeId),
      deadline: this.deadlineLabel(item),
      recurrence: this.recurrenceLabel(item),
      description: item.description,
      videoLinks: item.videoLinks,
      trend: [] as { name: string; series: { name: string; value: number }[] }[],
      comments: [] as { date: string; tag: string; text: string }[],
    }));
    const notStarted = this.clientActivityGroups.find(g => g.label === 'Not Started');
    if (notStarted) {
      notStarted.activities.push(...newActivities);
    } else {
      this.clientActivityGroups.push({ label: 'Not Started', activities: newActivities });
    }
    this.messageService.add({
      severity: 'success', summary: 'Activities shared',
      detail: `${newActivities.length} activit${newActivities.length === 1 ? 'y' : 'ies'} added for ${this.selectedClient?.first_name} (preview only).`,
    });
    this.activityBucket = [];
    this.activityForm = this.newActivityForm();
    this.leaveAddActivity();
  }

  cancelAddActivity(): void {
    if (this.activityForm.name.trim() || this.activityBucket.length) {
      this.showBucketConfirmDialog = true;
    } else {
      this.leaveAddActivity();
    }
  }

  confirmAddToBucketAndLeave(): void {
    if (this.activityForm.name.trim()) { this.addToBucket(); }
    this.showBucketConfirmDialog = false;
    this.leaveAddActivity();
  }

  discardAndLeaveAddActivity(): void {
    this.activityForm = this.newActivityForm();
    this.activityBucket = [];
    this.showBucketConfirmDialog = false;
    this.leaveAddActivity();
  }

  /** "Skip and Finish" (new-client flow only) - unlike Cancel, skipping never asks to save
      unsaved form data first, since the whole point is finishing onboarding without activities. */
  skipAndFinishNewClient(): void {
    this.activityForm = this.newActivityForm();
    this.activityBucket = [];
    this.leaveAddActivity();
  }

  moodChartData = [
    { name: 'Mood', series: [
      { name: 'Jul 3', value: 2 }, { name: 'Jul 10', value: 3 }, { name: 'Jul 17', value: 2 },
      { name: 'Jul 24', value: 4 }, { name: 'Jul 31', value: 4 },
    ] },
  ];

  scoreChartData = [
    { name: 'PHQ-9', series: [
      { name: 'Jul 3', value: 14 }, { name: 'Jul 10', value: 12 }, { name: 'Jul 17', value: 11 },
      { name: 'Jul 24', value: 10 }, { name: 'Jul 31', value: 9 },
    ] },
    { name: 'GAD-7', series: [
      { name: 'Jul 3', value: 11 }, { name: 'Jul 10', value: 10 }, { name: 'Jul 17', value: 9 },
      { name: 'Jul 24', value: 8 }, { name: 'Jul 31', value: 7 },
    ] },
  ];

  clientMessages = [
    { date: 'Aug 5, 2026', items: [
      { role: 'CLIENT', time: '9:12 AM', text: "Had a rough night, couldn't sleep much." },
      { role: 'THERAPIST', time: '9:40 AM', text: "Thanks for letting me know - let's talk through it in our session today." },
      { role: 'CLIENT', time: '9:41 AM', text: 'Okay, see you at 11.' },
    ] },
  ];
  chatActive = true;
  newMessageText = '';

  sendClientMessage(): void {
    if (!this.newMessageText.trim()) { return; }
    this.clientMessages[this.clientMessages.length - 1].items.push(
      { role: 'THERAPIST', time: 'Just now', text: this.newMessageText.trim() },
    );
    this.newMessageText = '';
  }

  progressComments = [
    { date: 'Jul 31, 2026', text: 'Felt proud of sticking with the breathing exercise all week.', tag: 'GREAT' },
    { date: 'Jul 28, 2026', text: 'It helped a bit but I forgot two days.', tag: 'GOOD' },
    { date: 'Jul 24, 2026', text: 'Could not focus, still anxious most of the day.', tag: 'BAD' },
  ];
  progressFilterTag: 'GREAT' | 'GOOD' | 'BAD' = 'GREAT';

  get filteredProgressComments() {
    return this.progressComments.filter(c => c.tag === this.progressFilterTag);
  }

  settingsType: 'Profile Details' | 'Change Password' | 'Delete Account' = 'Profile Details';
  settingsOptions = ['Profile Details', 'Change Password', 'Delete Account'];

  editStatus = false;

  therapistDetails = {
    first_name: 'Alicia',
    last_name: 'Moreno',
    gender_name: 'Female',
    email_id: 'alicia.moreno@clinic.com',
    phone_number: '(555) 019-2231',
    years_of_experience: '7',
    clinic_name: 'Riverside Wellness Group',
    address_street_name: '482 Birchwood Ave',
    address_apartment: 'Suite 3B',
    address_town_city: 'Portland',
    address_zip_code: '97205',
    timezone_name: 'Pacific Time (PT)',
  };
  dob: Date = new Date(1988, 3, 12);

  specializationOptions = ['CBT', 'Trauma-Informed Care', 'Family Therapy', 'DBT', 'EMDR', 'Grief Counseling'];
  filteredSpecializations: string[] = [];
  specialization = '';
  specializationList: string[] = ['CBT', 'Trauma-Informed Care', 'Family Therapy'];

  timezones = [
    { name: 'Eastern Time (ET)' },
    { name: 'Central Time (CT)' },
    { name: 'Mountain Time (MT)' },
    { name: 'Pacific Time (PT)' },
  ];

  logoDataUrl: string | null = null;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  reasonList = [
    { reason_id: 1, reason: 'I no longer need this service' },
    { reason_id: 2, reason: 'I found an alternative' },
    { reason_id: 3, reason: 'Privacy concerns' },
    { reason_id: 4, reason: 'Other' },
  ];
  deleteReason: number | null = null;
  deleteFeedback = '';
  deleteDialogVisible = false;

  constructor(private messageService: MessageService) {}

  switchTheme(theme: ThemeOption): void {
    this.activeTheme = theme.key;
    const link = document.getElementById('prime-theme') as HTMLLinkElement | null;
    if (link) {
      link.href = 'assets/primeng-themes/' + theme.file;
    }
  }

  enableEdit(): void {
    this.editStatus = true;
  }

  cancelProfileUpdate(): void {
    this.editStatus = false;
  }

  updateTherapistDetails(): void {
    this.editStatus = false;
    this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Profile changes saved (preview only).' });
  }

  filterSpecializations(query: string): void {
    this.filteredSpecializations = this.specializationOptions.filter(
      o => o.toLowerCase().includes(query.toLowerCase()) && !this.specializationList.includes(o)
    );
  }

  selectSpecialization(value: string): void {
    if (value && !this.specializationList.includes(value)) {
      this.specializationList.push(value);
    }
    this.specialization = '';
  }

  removeSpecialization(value: string): void {
    this.specializationList = this.specializationList.filter(s => s !== value);
  }

  triggerFile(input: HTMLInputElement): void {
    input.click();
  }

  uploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) { return; }
    const reader = new FileReader();
    reader.onload = () => {
      this.logoDataUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  changePassword(): void {
    this.messageService.add({ severity: 'success', summary: 'Password changed', detail: 'Preview only — nothing was sent to the server.' });
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
  }

  toggleDeleteDialog(): void {
    this.deleteDialogVisible = !this.deleteDialogVisible;
  }

  deleteAccount(): void {
    this.deleteDialogVisible = false;
    this.messageService.add({ severity: 'warn', summary: 'Delete requested', detail: 'Preview only — no account was deleted.' });
  }

  /** ================= AI ASSISTANT (concept, preview only) =================
      A different interaction mode entirely: instead of navigating screens, the therapist
      describes what they want and a (mocked) agent finds/drafts it. "Assign" buttons on the
      result cards feed straight into the real Add Activity bucket flow, pre-filled - the
      point isn't a disconnected chat toy, it's fewer clicks to the same structured outcome. */
  aiMessages: AiMessage[] = [
    { role: 'user', text: 'Find a box breathing video I can send to James Carter before his next session.' },
    { role: 'assistant',
      steps: [
        'Searched the activity library for breathing exercises',
        'Found a matching guided video from the wellness content partner',
        'Drafted an activity ready to assign',
      ],
      text: 'Found a good one — a 5-minute guided box breathing video. I can assign it as an activity for James right now.',
      videoCard: {
        title: 'Box Breathing — 5 Minute Guided Practice', source: 'Wellness Video Library', duration: '5:12',
        clientId: 2, activityName: 'Box breathing exercise',
        activityDescription: 'A 5-minute guided box breathing video to practice before sessions or during moments of anxiety.',
      } },
  ];

  aiInput = '';
  aiThinking = false;

  aiQuickPrompts = [
    'Find a box breathing video for James Carter',
    'Suggest a sleep hygiene activity for Derek Osei',
    "Summarize Priya Nair's week",
  ];

  guessAiClientId(message: string): number | null {
    const lower = message.toLowerCase();
    const found = this.activeClients.find(c => lower.includes(c.first_name.toLowerCase()) || lower.includes(c.last_name.toLowerCase()));
    return found ? found.client_id : null;
  }

  craftAiResponse(message: string): AiMessage {
    const lower = message.toLowerCase();
    const clientId = this.guessAiClientId(message);

    if (lower.includes('breath')) {
      return {
        role: 'assistant',
        steps: [
          'Searched the activity library for breathing exercises',
          'Found a matching guided video from the wellness content partner',
          'Drafted an activity ready to assign',
        ],
        text: 'Found a good one — a 5-minute guided box breathing video. I can assign it as an activity right now.',
        videoCard: {
          title: 'Box Breathing — 5 Minute Guided Practice', source: 'Wellness Video Library', duration: '5:12',
          clientId: clientId ?? 2, activityName: 'Box breathing exercise',
          activityDescription: 'A 5-minute guided box breathing video to practice before sessions or during moments of anxiety.',
        },
      };
    }

    if (lower.includes('sleep')) {
      return {
        role: 'assistant',
        steps: [
          "Checked the client's recent notes for sleep-related mentions",
          'Matched against the standard activity library',
          'Drafted an activity ready to assign',
        ],
        text: 'A sleep hygiene checklist looks like a strong fit given the recent notes. Want me to assign it?',
        activityCard: {
          name: 'Sleep hygiene checklist',
          description: 'A nightly checklist of habits that support consistent, restful sleep.',
          clientId: clientId ?? 6,
        },
      };
    }

    if (lower.includes('summar')) {
      const client = this.clientOf(clientId ?? 3);
      return {
        role: 'assistant',
        steps: ['Pulled recent sessions, activity responses, and mood trend', 'Checked for any pending safety flags'],
        text: client ? `Here's the week for ${client.first_name} ${client.last_name}:` : "I couldn't find that client in this preview's roster.",
        summaryCard: client ? {
          clientId: client.client_id,
          bullets: [
            `Mood trend: ${client.moodTrend === 'down' ? 'declining' : client.moodTrend === 'up' ? 'improving' : 'steady'}`,
            `${client.pendingTasks} activities pending, ${this.overdueCountOf(client)} overdue`,
            `Next session in ${client.nextSessionDays} days (${client.nextSessionDate})`,
          ],
        } : undefined,
      };
    }

    return {
      role: 'assistant',
      steps: ['Searched the activity library', 'No strong match found for that request'],
      text: "I couldn't find an exact match for that yet in this preview — try one of the quick prompts below, like asking for a breathing video, a sleep activity, or a client summary.",
    };
  }

  sendAiMessage(promptText?: string): void {
    const message = (promptText ?? this.aiInput).trim();
    if (!message || this.aiThinking) { return; }
    this.aiMessages.push({ role: 'user', text: message });
    this.aiInput = '';
    this.aiThinking = true;
    setTimeout(() => {
      this.aiThinking = false;
      this.aiMessages.push(this.craftAiResponse(message));
    }, 1100);
  }

  assignAiVideoCard(msg: AiMessage): void {
    if (!msg.videoCard) { return; }
    const client = this.clientOf(msg.videoCard.clientId);
    if (!client) { return; }
    this.selectedClient = client;
    this.openAddActivity();
    this.activityForm.name = msg.videoCard.activityName;
    this.activityForm.description = msg.videoCard.activityDescription;
    this.activityForm.videoLinks = [{ label: msg.videoCard.title, url: 'https://example.com/videos/box-breathing' }];
    this.messageService.add({ severity: 'success', summary: 'Draft ready', detail: `Prefilled "${msg.videoCard.activityName}" for ${client.first_name} — review and add to bucket.` });
  }

  assignAiActivityCard(msg: AiMessage): void {
    if (!msg.activityCard) { return; }
    const client = this.clientOf(msg.activityCard.clientId);
    if (!client) { return; }
    this.selectedClient = client;
    this.openAddActivity();
    this.activityForm.name = msg.activityCard.name;
    this.activityForm.description = msg.activityCard.description;
    this.messageService.add({ severity: 'success', summary: 'Draft ready', detail: `Prefilled "${msg.activityCard.name}" for ${client.first_name} — review and add to bucket.` });
  }
}
