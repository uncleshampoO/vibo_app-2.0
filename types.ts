export enum AppMode {
  INVOICE = 'invoice',
  SHARK = 'shark',
  PROFILE = 'profile'
}

export enum UserTier {
  FREE = 'free',
  SECRETARY = 'secretary', // 79р
  ASSISTANT = 'assistant', // 399р
  CLOSER = 'closer'        // 990р
}

export interface SellerProfile {
  id: string;
  name: string;
  inn: string;
  kpp: string;
  bankName: string;
  bik: string;
  accountNumber: string;
  corrAccount: string;
  address: string;
  logoUrl?: string;
  director?: string;
  accountant?: string;
}

export interface BuyerProfile {
  name: string;
  inn: string;
  kpp: string;
  address: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}
