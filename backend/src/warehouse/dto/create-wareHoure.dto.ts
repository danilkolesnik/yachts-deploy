export class CreateWareHourehDto {
    name: string;
    quantity: string;
    inventory: string;
    comment: string;
    countryCode: string;
    pricePerUnit: string;
    serviceCategory: {
      serviceName: string;
      priceInEuroWithoutVAT: number;
    };
  }