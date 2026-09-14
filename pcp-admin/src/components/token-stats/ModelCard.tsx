import { ModelData } from '@/types/token-stats.types';

type ModelCardProps = {
  model: ModelData;
  price: number | '';
};

export function ModelCard({ model, price }: ModelCardProps) {
  return (
    <div className="bg-gray-50 p-3 rounded border text-sm min-w-[180px]">
      <div className="font-medium text-gray-900 mb-2 break-words">
        {model.model}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>
          Prompt:{' '}
          <span className="font-medium">
            {model.promptTokens.toLocaleString()}
          </span>
        </div>
        <div>
          Completion:{' '}
          <span className="font-medium">
            {model.completionTokens.toLocaleString()}
          </span>
        </div>
        <div>
          Total:{' '}
          <span className="font-medium">
            {model.totalTokens.toLocaleString()}
          </span>
        </div>
        <div>
          Cost:{' '}
          <span className="font-medium text-green-600">
            {model.cost > 0
              ? `$${model.cost.toFixed(2)}`
              : price !== ''
                ? '$0.00'
                : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
