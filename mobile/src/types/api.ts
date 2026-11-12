export interface WalletResponse {
  accountId: number;
  balance: number;
}

export interface LaundryServiceResponse {
  id: number;
  name: string;
  price: number;
}

export interface ConsumeServiceRequest {
  accountId: number;
  serviceId: number;
}

export interface ConsumeServiceResponse {
  transactionId: string;
  serviceId: number;
  amount: number;
  remainingBalance: number;
  status: string;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}
