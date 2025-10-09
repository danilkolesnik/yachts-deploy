export class CreateOfferDto {
    userId: string;
    customerFullName: string;
    customerId: string;
    yachtName: string;
    yachtModel: string;
    location: string;
    comment?: string;
    countryCode: string;
    yachts: { id: string; name: string; model: string; countryCode: string; userId: string; userName: string }[];
    services: { serviceName: string; priceInEuroWithoutVAT: number } | { serviceName: string; priceInEuroWithoutVAT: number }[];
    parts: { partName: string; quantity: number }[];
    status: string;
    yachtId: string;
    description: string;
    price: number;
    imageUrls?: string[];
    videoUrls?: string[];
    language?: 'en' | 'de' | 'hr';
}