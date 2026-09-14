import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ModelData } from '@/types/token-stats.types';
import { ModelCard } from './ModelCard';

type UserModelsAccordionProps = {
  userId: string | null;
  userIndex: number;
  models: ModelData[];
  selectedModel: string;
  price: number | '';
  isLoading: boolean;
};

export function UserModelsAccordion({
  userId,
  userIndex,
  models,
  selectedModel,
  price,
  isLoading,
}: UserModelsAccordionProps) {
  if (isLoading) {
    return (
      <span className="text-sm text-gray-400">Loading models...</span>
    );
  }

  if (models.length === 0) {
    return <span className="text-sm text-gray-400">No models</span>;
  }

  const filteredModels = models.filter((model) => {
    if (selectedModel === 'all') return true;
    const lowerName = model.model.toLowerCase();
    if (selectedModel === 'autocompletion') {
      return lowerName.includes('openai') || lowerName.includes('gpt');
    } else if (selectedModel === 'enhance') {
      return lowerName.includes('qwen');
    }
    return true;
  });

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem
        value={`user-${userId}-${userIndex}`}
        className="border-none"
      >
        <AccordionTrigger className="py-1 text-sm text-blue-600 hover:text-blue-800 hover:no-underline">
          {models.length} model{models.length !== 1 ? 's' : ''}
        </AccordionTrigger>
        <AccordionContent className="pb-2">
          <div className="space-y-2 pt-2 max-h-96 overflow-y-auto">
            {filteredModels.map((model, modelIdx) => (
              <ModelCard key={modelIdx} model={model} price={price} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

