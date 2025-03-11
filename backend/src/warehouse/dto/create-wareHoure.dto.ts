export class CreateWareHourehDto {
    name: string;
    quantity: string;
    inventory: string;
    comment: string;
    countryCode: string;
    serviceCategory: {
      serviceName: string;
      priceInEuroWithoutVAT: number;
    };
  }