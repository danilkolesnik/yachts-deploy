export class CreateOfferDto {
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
    yachtId: string;
    title: string;
    description: string;
    price: number;
    imageUrls?: string[];
    videoUrls?: string[];
}