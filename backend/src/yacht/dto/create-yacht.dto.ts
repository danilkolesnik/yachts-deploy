export class CreateYachtDto {
  name: string;
  model: string;
  repairTime?: string;
  countryCode?: string;
  // legacy fields (kept for backward compatibility with existing DB rows)
  ownerContacts?: string;
  engineHours?: number;

  // owner contacts (new structured fields used by frontend)
  owner?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerAddress?: string;

  // technical specifications (new structured fields used by frontend)
  engineCount?: string;
  engines?: Array<{ model?: string; hours?: string | number }>;
  hasGenerators?: string;
  generatorCount?: string;
  generators?: Array<{ model?: string; hours?: string | number }>;
  hasAirConditioners?: string;
  airConditionerCount?: string;
  airConditioners?: Array<{ model?: string; hours?: string | number }>;
  description?: string;
  userId?: string;
  userName?: string;
} 