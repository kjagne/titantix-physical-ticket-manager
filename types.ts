
export enum TicketStatus {
  UNSOLD = 'UNSOLD',
  SOLD = 'SOLD',
  USED = 'USED',
}

export interface Ticket {
  serial: string;
  token: string;
  status: TicketStatus;
  ticketTypeName: string;
  price: number;
  printBatchId: string;
  soldAt?: string;
  usedAt?: string;
  usedByDevice?: string;
  stubColor?: string;
}

export interface TicketTypeInfo {
  id: string;
  name: string;
  quantity: number;
  price: number;
  stubColor?: string;
}
