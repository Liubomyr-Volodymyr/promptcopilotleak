export type ModelData = {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
};

export type UserModelsData = Record<string, ModelData[]>;

