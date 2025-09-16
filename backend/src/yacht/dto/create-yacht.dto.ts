export class CreateYachtDto {
  name: string;
  model: string;
  repairTime?: string;
  countryCode?: string;
  ownerContacts?: string;
  registrationNameOrType?: string;
  enginesCount?: number;
  engineHours?: number;
  description?: string;
} 