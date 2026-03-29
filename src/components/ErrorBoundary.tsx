import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md px-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Что-то пошло не так</h2>
            <p className="text-sm text-muted-foreground">{this.state.error?.message || "Неизвестная ошибка рендера"}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>← Назад</Button>
              <Button onClick={() => this.setState({ hasError: false, error: null })}>Попробовать снова</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
