export type PatientStatus = 'waiting' | 'in_consultation' | 'done';

export interface Patient {
  id: string;
  token_number: number;
  name: string;
  status: PatientStatus;
  is_priority: boolean;
  is_edited: boolean;
  created_at: string;
  called_at: string | null;
  completed_at: string | null;
}

export interface ClinicSettings {
  id: number;
  avg_consultation_minutes: number;
  current_token: number;
}
