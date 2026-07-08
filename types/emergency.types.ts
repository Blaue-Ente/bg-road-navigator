/**
 * BG Road Navigator - Emergency Types
 */

export interface CountryEmergency {
  country: string;
  flag: string;
  police: string;
  ambulance: string;
  fire: string;
  roadside_assistance: string;
  roadside_assistance_name: string;
  eu_emergency: "112";
  towing_service: string;
  notes: string;
}

export interface EmergencyState {
  activeAlerts: CountryEmergency[];
  selectedEmergency: CountryEmergency | null;
}