export class CreatePricelistDto {
    serviceName: string;
    serviceNameHr?: string;
    serviceCode?: string;
    priceInEuroWithoutVAT: number;
    unitsOfMeasurement?: string;
    description?: string;
}