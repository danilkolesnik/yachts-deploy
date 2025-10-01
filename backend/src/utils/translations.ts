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
  | 'VIDEO_FILE_AVAILABLE'
  // Invoice-specific and other labels
  | 'INVOICE'
  | 'PLACE_AND_DATE'
  | 'WAREHOUSE'
  | 'REMARK'
  | 'METHOD_OF_PAYMENT'
  | 'ORDER'
  | 'NAME'
  | 'MODEL'
  | 'COUNTRY'
  | 'LOCATION_LABEL'
  | 'ID'
  | 'PRICE_PER_UNIT_EUR'
  | 'PRICE_EUR'
  | 'WORK'
  | 'TAX_BASE_25'
  | 'TAX_BASE_VAT'
  | 'VAT'
  | 'INVENTORY_COSTS'
  | 'WITHOUT_TAX'
  | 'TOTAL_AMOUNT_TITLE'
  | 'IN_WORDS'
  | 'ISSUE_DATE_ABBR'
  | 'PAYMENT_DUE'
  | 'REFERENCE_NUMBER'
  | 'PAYMENT_TO_BANK_ACCOUNT'
  | 'PAYMENT_MARK'
  | 'ISSUE_DATETIME'
  | 'DOCUMENT_ISSUED_BY'
  | 'COMPANY_REG_1'
  | 'COMPANY_REG_2'
  | 'COMPANY_REG_3'
  | 'BENEFICIARY'
  | 'BENEFICIARY_BANK'
  | 'BANK_ADDRESS'
  | 'SWIFT';

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
    INVOICE: 'INVOICE',
    PLACE_AND_DATE: 'Place and date of issue',
    WAREHOUSE: 'MAIN WAREHOUSE',
    REMARK: 'Remark',
    METHOD_OF_PAYMENT: 'Method of payment',
    ORDER: 'Order',
    NAME: 'Name',
    MODEL: 'Model',
    COUNTRY: 'Country',
    LOCATION_LABEL: 'Location',
    ID: 'ID',
    PRICE_PER_UNIT_EUR: 'Price per unit EUR',
    PRICE_EUR: 'Price EUR',
    WORK: 'Work',
    TAX_BASE_25: 'Tax base 25%',
    TAX_BASE_VAT: 'Tax base VAT',
    VAT: 'VAT',
    INVENTORY_COSTS: 'Inventory costs',
    WITHOUT_TAX: 'Without tax',
    TOTAL_AMOUNT_TITLE: 'Total amount',
    IN_WORDS: 'IN WORDS:',
    ISSUE_DATE_ABBR: 'DUE:',
    PAYMENT_DUE: 'Payment due:',
    REFERENCE_NUMBER: 'Reference number:',
    PAYMENT_TO_BANK_ACCOUNT: 'Payment must be made to a bank account',
    PAYMENT_MARK: 'Payment designation: Transaction account',
    ISSUE_DATETIME: 'Date and time of issue',
    DOCUMENT_ISSUED_BY: 'Document issued by',
    COMPANY_REG_1: 'The company is registered with the Commercial Court in Pazin MBS 130134955',
    COMPANY_REG_2: 'The share capital amounts to EUR 2,654.46 and has been paid in full.',
    COMPANY_REG_3: 'Members of the management board: Viktor Cherednichenko',
    BENEFICIARY: 'Beneficiary',
    BENEFICIARY_BANK: 'Beneficiary Bank',
    BANK_ADDRESS: 'Bank address',
    SWIFT: 'SWIFT',
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
    INVOICE: 'RECHNUNG',
    PLACE_AND_DATE: 'Ausstellungsort und -datum',
    WAREHOUSE: 'HAUPTLAGER',
    REMARK: 'Bemerkung',
    METHOD_OF_PAYMENT: 'Zahlungsmethode',
    ORDER: 'Bestellung',
    NAME: 'Name',
    MODEL: 'Modell',
    COUNTRY: 'Land',
    LOCATION_LABEL: 'Standort',
    ID: 'ID',
    PRICE_PER_UNIT_EUR: 'Preis pro Einheit EUR',
    PRICE_EUR: 'Preis EUR',
    WORK: 'Arbeit',
    TAX_BASE_25: 'Steuerbasis 25 %',
    TAX_BASE_VAT: 'MwSt.-Bemessungsgrundlage',
    VAT: 'MwSt.',
    INVENTORY_COSTS: 'Lagerkosten',
    WITHOUT_TAX: 'Ohne Steuer',
    TOTAL_AMOUNT_TITLE: 'Gesamtbetrag',
    IN_WORDS: 'IN WORTEN:',
    ISSUE_DATE_ABBR: 'FÄLLIG:',
    PAYMENT_DUE: 'Zahlbar bis:',
    REFERENCE_NUMBER: 'Referenznummer:',
    PAYMENT_TO_BANK_ACCOUNT: 'Zahlung muss auf ein Bankkonto erfolgen',
    PAYMENT_MARK: 'Zahlungskennzeichen: Transaktionskonto',
    ISSUE_DATETIME: 'Ausstellungsdatum und -zeit',
    DOCUMENT_ISSUED_BY: 'Dokument ausgestellt von',
    COMPANY_REG_1: 'Das Unternehmen ist beim Handelsgericht in Pazin eingetragen MBS 130134955',
    COMPANY_REG_2: 'Das Grundkapital beträgt 2.654,46 EUR und ist vollständig eingezahlt.',
    COMPANY_REG_3: 'Mitglied der Geschäftsführung: Viktor Cherednichenko',
    BENEFICIARY: 'Empfänger',
    BENEFICIARY_BANK: 'Empfängerbank',
    BANK_ADDRESS: 'Bankadresse',
    SWIFT: 'SWIFT',
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
    INVOICE: 'RAČUN',
    PLACE_AND_DATE: 'Mjesto i datum izdavanja',
    WAREHOUSE: 'GLAVNO SKLADIŠTE',
    REMARK: 'Napomena',
    METHOD_OF_PAYMENT: 'Način plaćanja',
    ORDER: 'Narudžba',
    NAME: 'Naziv',
    MODEL: 'Model',
    COUNTRY: 'Država',
    LOCATION_LABEL: 'Lokacija',
    ID: 'ID',
    PRICE_PER_UNIT_EUR: 'Cijena po jedinici EUR',
    PRICE_EUR: 'Cijena EUR',
    WORK: 'Rad',
    TAX_BASE_25: 'Osnovica 25 %',
    TAX_BASE_VAT: 'Osnovica PDV',
    VAT: 'PDV',
    INVENTORY_COSTS: 'Troškovi inventara',
    WITHOUT_TAX: 'Bez poreza',
    TOTAL_AMOUNT_TITLE: 'Ukupni iznos',
    IN_WORDS: 'SLOVIMA:',
    ISSUE_DATE_ABBR: 'DVO:',
    PAYMENT_DUE: 'Rok plaćanja:',
    REFERENCE_NUMBER: 'Poziv na broj:',
    PAYMENT_TO_BANK_ACCOUNT: 'Plaćanje se mora izvršiti na bankovni račun',
    PAYMENT_MARK: 'Oznaka plaćanja: Transakcijski račun',
    ISSUE_DATETIME: 'Datum i vrijeme izdavanja',
    DOCUMENT_ISSUED_BY: 'Dokument izdao',
    COMPANY_REG_1: 'Društvo je upisano kod Trgovačkog suda u Pazinu MBS 130134955',
    COMPANY_REG_2: 'Temeljni kapital iznosi 2.654,46 EUR i uplaćen je u cijelosti.',
    COMPANY_REG_3: 'Članovi uprave: Viktor Cherednichenko',
    BENEFICIARY: 'Korisnik',
    BENEFICIARY_BANK: 'Banka primatelj',
    BANK_ADDRESS: 'Adresa banke',
    SWIFT: 'SWIFT / BRZ',
  },
};

export function getTranslations(lang?: string) {
  const language = (lang as SupportedLanguage) || 'en';
  return translations[language] ?? translations.en;
}


