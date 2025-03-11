export class CreateOfferhDto {
    userId: string;
    customerFullName: string;
    customerId: string;
    yachtName: string;
    yachtModel: string;
    comment?: string;
    countryCode: string;
    services: { serviceName: string; priceInEuroWithoutVAT: number }[];
    parts: { partName: string; quantity: number }[];
    status: string;
  }