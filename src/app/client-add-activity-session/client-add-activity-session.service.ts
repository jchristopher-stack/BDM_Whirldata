import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClientAddActivitySessionService {

  activity_name: any;
  activity_description: any;
  activity_type_id: any;
  city: any;
  therapist_id: any;
  activity_recurrence_type_id: any
  activity_recurrence: any
  activity_cluster_id: any
  activity_deadline: any;
  activity_url: any;
  activity_started_on: any
  activity_ended_on: any;
  isExisting: any;
  constructor() { }
}
