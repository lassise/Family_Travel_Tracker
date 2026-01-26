import React, { Component, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details (always log errors, even in production)
    logger.error("ErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Separate component to use hooks (useNavigate)
interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

const ErrorFallback = ({ error, onReset }: ErrorFallbackProps) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    onReset();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            We encountered an unexpected error. Don't worry, your data is safe.
          </p>
          
          {import.meta.env.DEV && error && (
            <details className="mt-4 p-3 bg-muted rounded-md text-xs">
              <summary className="cursor-pointer font-medium mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="overflow-auto max-h-48 text-xs">
                {error.toString()}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={onReset} className="w-full" variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleGoHome} className="w-full" variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Wrapper component to provide hooks context
export const ErrorBoundary = ({ children, fallback, onReset }: Props) => {
  return (
    <ErrorBoundaryClass fallback={fallback} onReset={onReset}>
      {children}
    </ErrorBoundaryClass>
  );
};

export default ErrorBoundary;
