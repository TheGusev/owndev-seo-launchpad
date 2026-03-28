import { AlertCircle, RefreshCw } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

interface EmptyStateProps {
  message?: string;
  onRetry?: () => void;
}

const EmptyState = ({ message = "Не удалось получить данные. Попробуйте снова.", onRetry }: EmptyStateProps) => (
  <div className="glass rounded-xl p-8 text-center space-y-4">
    <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
    <p className="text-sm text-muted-foreground">{message}</p>
    {onRetry && (
      <GradientButton size="sm" onClick={onRetry}>
        <RefreshCw className="w-4 h-4 mr-2" /> Повторить
      </GradientButton>
    )}
  </div>
);

export default EmptyState;
