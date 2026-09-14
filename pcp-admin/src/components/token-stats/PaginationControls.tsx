import { Button } from '@/components/ui/button';

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  limit: number;
  total: number;
  rowsCount: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export function PaginationControls({
  currentPage,
  totalPages,
  limit,
  total,
  rowsCount,
  onPageChange,
  onLimitChange,
}: PaginationControlsProps) {
  const start = rowsCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = (currentPage - 1) * limit + rowsCount;

  return (
    <div className="flex flex-wrap items-center justify-between mt-4">
      <div className="text-sm text-gray-600">
        Showing {start} - {end} of {total}
      </div>

      <div className="flex items-center gap-2 mt-2 md:mt-0">
        <select
          value={limit}
          onChange={(e) => {
            onLimitChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="p-2 border rounded bg-white"
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={500}>500</option>
        </select>
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Prev
        </Button>
        <div className="px-3 py-2 border rounded bg-white">{currentPage}</div>
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

