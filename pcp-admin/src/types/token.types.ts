export type TokenRow = {
  id?: number;
  userId?: string;
  email?: string;
  model?: string;
  feature?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  createdAt?: string;
};

export type TokenResponse = {
  items?: TokenRow[];
  data?: any[];
  totals?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number | null;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    groupBy?: string;
  };
};
