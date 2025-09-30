export type SupportedLanguage = 'en' | 'de' | 'hr';

type TranslationKeys =
  | 'OFFER'
  | 'NUMBER'
  | 'DATE'
  | 'CUSTOMER'
  | 'ADDRESS'
  | 'DESCRIPTION'
  | 'DESCRIPTION_VALUE'
  | 'YACHT_NAME'
  | 'YACHT_MODEL'
  | 'REG_NUMBER'
  | 'LOCATION'
  | 'PRODUCTS'
  | 'NO'
  | 'QUANTITY'
  | 'PRICE_PER_PCS'
  | 'PRICE'
  | 'SUBTOTAL'
  | 'PROVIDED_SERVICES'
  | 'SERVICE'
  | 'TOTAL_AMOUNT'
  | 'BANK_DETAILS'
  | 'IMAGES'
  | 'VIDEOS'
  | 'IMAGE_LABEL'
  | 'VIDEO_LABEL'
  | 'VIDEO_FILE_AVAILABLE';

export const translations: Record<SupportedLanguage, Record<TranslationKeys, string>> = {
  en: {
    OFFER: 'OFFER',
    NUMBER: 'Number',
    DATE: 'Date',
    CUSTOMER: 'Customer',
    ADDRESS: 'Address',
    DESCRIPTION: 'Description',
    DESCRIPTION_VALUE: 'Non Schedule Service',
    YACHT_NAME: 'Yacht Name',
    YACHT_MODEL: 'Yacht Model / SN/SB',
    REG_NUMBER: 'Reg. Number',
    LOCATION: 'Location',
    PRODUCTS: 'Products',
    NO: 'No.',
    QUANTITY: 'Quantity',
    PRICE_PER_PCS: 'Price in EURO per pcs',
    PRICE: 'Price in EURO',
    SUBTOTAL: 'SUBTOTAL',
    PROVIDED_SERVICES: 'Provided Services',
    SERVICE: 'Service',
    TOTAL_AMOUNT: 'TOTAL AMOUNT',
    BANK_DETAILS: 'BANK DETAILS',
    IMAGES: 'Images',
    VIDEOS: 'Videos',
    IMAGE_LABEL: 'Image',
    VIDEO_LABEL: 'Video',
    VIDEO_FILE_AVAILABLE: 'Video file available at:',
  },
  de: {
    OFFER: 'ANGEBOT',
    NUMBER: 'Nummer',
    DATE: 'Datum',
    CUSTOMER: 'Kunde',
    ADDRESS: 'Adresse',
    DESCRIPTION: 'Beschreibung',
    DESCRIPTION_VALUE: 'Außerplanmäßiger Service',
    YACHT_NAME: 'Yachtname',
    YACHT_MODEL: 'Yachtmodell / SN/SB',
    REG_NUMBER: 'Reg.-Nummer',
    LOCATION: 'Ort',
    PRODUCTS: 'Produkte',
    NO: 'Nr.',
    QUANTITY: 'Menge',
    PRICE_PER_PCS: 'Preis in EURO pro Stk.',
    PRICE: 'Preis in EURO',
    SUBTOTAL: 'ZWISCHENSUMME',
    PROVIDED_SERVICES: 'Erbrachte Leistungen',
    SERVICE: 'Leistung',
    TOTAL_AMOUNT: 'GESAMTBETRAG',
    BANK_DETAILS: 'BANKVERBINDUNG',
    IMAGES: 'Bilder',
    VIDEOS: 'Videos',
    IMAGE_LABEL: 'Bild',
    VIDEO_LABEL: 'Video',
    VIDEO_FILE_AVAILABLE: 'Videodatei verfügbar unter:',
  },
  hr: {
    OFFER: 'PONUDA',
    NUMBER: 'Broj',
    DATE: 'Datum',
    CUSTOMER: 'Kupac',
    ADDRESS: 'Adresa',
    DESCRIPTION: 'Opis',
    DESCRIPTION_VALUE: 'Usluga izvan rasporeda',
    YACHT_NAME: 'Ime jahte',
    YACHT_MODEL: 'Model jahte / SN/SB',
    REG_NUMBER: 'Reg. Broj',
    LOCATION: 'Mjesto',
    PRODUCTS: 'Proizvodi',
    NO: 'Br.',
    QUANTITY: 'Količina',
    PRICE_PER_PCS: 'Cijena u Eurima po kom',
    PRICE: 'Cijena u Eurima',
    SUBTOTAL: 'UKUPNO',
    PROVIDED_SERVICES: 'Pružene usluge',
    SERVICE: 'Servis',
    TOTAL_AMOUNT: 'SVEUKUPNI IZNOS',
    BANK_DETAILS: 'BANKOVNI DETALJI',
    IMAGES: 'Slike',
    VIDEOS: 'Video',
    IMAGE_LABEL: 'Slika',
    VIDEO_LABEL: 'Video',
    VIDEO_FILE_AVAILABLE: 'Video datoteka dostupna na:',
  },
};

export function getTranslations(lang?: string) {
  const language = (lang as SupportedLanguage) || 'en';
  return translations[language] ?? translations.en;
}


