import { Repository } from 'typeorm';
import { offer } from 'src/offer/entities/offer.entity';
import { users } from 'src/auth/entities/users.entity';

export type SendEmailRecipientBody = {
  email?: string;
  useCustomerEmail?: boolean;
};

export async function getCustomerEmailForOffer(
  offerRepository: Repository<offer>,
  usersRepository: Repository<users>,
  offerId: string,
): Promise<{
  code: number;
  email?: string;
  customerName?: string;
  message?: string;
}> {
  const offerEntity = await offerRepository.findOne({ where: { id: offerId } });
  if (!offerEntity) {
    return { code: 404, message: 'Offer not found' };
  }

  if (!offerEntity.customerId) {
    return { code: 400, message: 'Customer is not linked to this offer' };
  }

  const customer = await usersRepository.findOne({
    where: { id: offerEntity.customerId },
  });

  const email = customer?.email?.trim();
  if (!email) {
    return { code: 404, message: 'Customer email not found' };
  }

  return {
    code: 200,
    email,
    customerName: customer?.fullName || offerEntity.customerFullName || '',
  };
}

export async function resolveOfferEmailRecipient(
  offerRepository: Repository<offer>,
  usersRepository: Repository<users>,
  offerId: string,
  body: SendEmailRecipientBody,
): Promise<{ code: number; email?: string; message?: string }> {
  if (body.useCustomerEmail) {
    return getCustomerEmailForOffer(offerRepository, usersRepository, offerId);
  }

  const email = body.email?.trim();
  if (!email) {
    return { code: 400, message: 'Email address is required' };
  }

  return { code: 200, email };
}
