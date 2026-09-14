import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type TokenStatsFiltersProps = {
  userId: string;
  selectedModel: string;
  price: number | '';
  onUserIdChange: (value: string) => void;
  onSelectedModelChange: (value: string) => void;
  onPriceChange: (value: number | '') => void;
  onApply: (e?: React.FormEvent) => void;
  onReset: () => void;
};

export function TokenStatsFilters({
  userId,
  selectedModel,
  price,
  onUserIdChange,
  onSelectedModelChange,
  onPriceChange,
  onApply,
  onReset,
}: TokenStatsFiltersProps) {
  return (
    <form
      onSubmit={onApply}
      className="grid grid-cols-1 lg:grid-cols-5 gap-3 bg-white p-4 rounded-lg shadow-sm border mb-4"
    >
      <Input
        placeholder="User ID"
        value={userId}
        onChange={(e) => onUserIdChange(e.target.value)}
      />

      <div className="flex gap-2">
        <Select value={selectedModel} onValueChange={onSelectedModelChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All models</SelectItem>
            <SelectItem value="autocompletion">Autocompletion</SelectItem>
            <SelectItem value="enhance">Enhance</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="number"
          step="0.01"
          placeholder="Price per token"
          value={price === '' ? '' : String(price)}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '') {
              onPriceChange('');
            } else {
              const numValue = parseFloat(value);
              if (!isNaN(numValue)) {
                onPriceChange(numValue);
              }
            }
          }}
        />
      </div>

      <div className="flex justify-end gap-2 lg:col-span-3">
        <Button type="button" variant="outline" onClick={onReset}>
          Reset
        </Button>
        <Button type="submit">Apply</Button>
      </div>
    </form>
  );
}

