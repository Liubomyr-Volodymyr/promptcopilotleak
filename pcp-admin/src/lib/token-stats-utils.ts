import { ModelData } from '@/types/token-stats.types';

export function extractModelName(r: any): string {
  return (
    r.model ??
    r.modelName ??
    r.model_name ??
    r.llmModel ??
    r.llm_model ??
    'Unknown'
  );
}

export function processModelData(
  dataArray: any[],
  price: number | '',
): ModelData[] {
  const modelMap = new Map<string, ModelData>();

  dataArray.forEach((r: any) => {
    const modelName = extractModelName(r);
    const prompt = Number(r.promptTokens ?? r.prompt_tokens ?? 0);
    const completion = Number(r.completionTokens ?? r.completion_tokens ?? 0);
    const total = Number(r.totalTokens ?? r.total_tokens ?? 0);

    if (modelMap.has(modelName)) {
      const existing = modelMap.get(modelName)!;
      existing.promptTokens += prompt;
      existing.completionTokens += completion;
      existing.totalTokens += total;
    } else {
      modelMap.set(modelName, {
        model: modelName,
        promptTokens: prompt,
        completionTokens: completion,
        totalTokens: total,
        cost: 0,
      });
    }
  });

  const priceNum = price !== '' ? Number(price) : 0;

  return Array.from(modelMap.values())
    .map((m) => ({
      ...m,
      cost: m.totalTokens * priceNum,
    }))
    .filter((m) => m.totalTokens > 0);
}

export function recalculateModelCosts(
  userModels: Record<string, ModelData[]>,
  price: number | '',
): Record<string, ModelData[]> {
  if (Object.keys(userModels).length === 0 || price === '') {
    return userModels;
  }

  const updatedModels: Record<string, ModelData[]> = {};
  const priceNum = Number(price);

  Object.entries(userModels).forEach(([userId, models]) => {
    updatedModels[userId] = models.map((m) => ({
      ...m,
      cost: m.totalTokens * priceNum,
    }));
  });

  return updatedModels;
}

