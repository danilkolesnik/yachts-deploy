import { Repository } from 'typeorm';
import { offer } from 'src/offer/entities/offer.entity';

const OFFER_NUMBER_PATTERN = /^\d{1,7}$/;
const MAX_OFFER_NUMBER = 9_999_999;

/**
 * Next sequential offer number: digits only, up to 7 characters.
 * Legacy non-numeric or longer IDs are ignored when computing the sequence.
 */
export async function generateOfferNumber(
  offerRepository: Repository<offer>,
): Promise<string> {
  const rows = await offerRepository.find({ select: ['id'] });

  let max = 0;
  for (const row of rows) {
    const id = String(row.id ?? '');
    if (!OFFER_NUMBER_PATTERN.test(id)) continue;
    const value = Number.parseInt(id, 10);
    if (value > max) max = value;
  }

  const next = max + 1;
  if (next > MAX_OFFER_NUMBER) {
    throw new Error('Maximum offer number (9999999) exceeded');
  }

  return String(next);
}

export function isValidOfferNumber(value: string): boolean {
  return OFFER_NUMBER_PATTERN.test(String(value ?? ''));
}
