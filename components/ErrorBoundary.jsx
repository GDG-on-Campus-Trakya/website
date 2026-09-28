"use client";
import React from "react";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="border-y border-rule py-10">
          <h2 className="font-display text-lg font-semibold text-ink">Bir şeyler ters gitti</h2>
          <p className="mt-1 max-w-measure text-sm text-muted-foreground">
            Bu bölümde bir hata oluştu. Sayfayı yenilemeyi deneyin.
          </p>
          <div className="mt-4">
            <Button onClick={() => window.location.reload()}>Sayfayı Yenile</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;