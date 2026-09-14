type TotalsSummaryProps = {
  totals: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number | null;
  };
};

export function TotalsSummary({ totals }: TotalsSummaryProps) {
  return (
    <div className="mt-4 bg-white p-4 rounded-lg shadow-sm border">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="text-sm text-gray-700">
          Prompt tokens:{' '}
          <span className="font-medium">{totals.promptTokens}</span>
        </div>
        <div className="text-sm text-gray-700">
          Completion tokens:{' '}
          <span className="font-medium">{totals.completionTokens}</span>
        </div>
        <div className="text-sm text-gray-700">
          Total tokens:{' '}
          <span className="font-medium">{totals.totalTokens}</span>
        </div>
        <div className="text-sm text-gray-700">
          Estimated cost:{' '}
          <span className="font-medium">
            {totals.cost != null ? totals.cost.toFixed(2) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

