interface UserIdObject {
    value: string;
    label: string;
  }
export class CreateOrderDto{
    userId: UserIdObject[];
    offerId: string;
    customerId:string;
    status?: string;
}