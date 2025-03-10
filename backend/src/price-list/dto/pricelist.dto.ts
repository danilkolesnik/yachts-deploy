export class CreatePricelistDto {
    serviceName: string;
    priceInEuroWithoutVAT: number;
    unitsOfMeasurement?: string;
}