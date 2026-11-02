export class CreatePricelistDto {
    serviceName: string;
    serviceNameHr?: string;
    priceInEuroWithoutVAT: number;
    unitsOfMeasurement?: string;
    description?: string;
}