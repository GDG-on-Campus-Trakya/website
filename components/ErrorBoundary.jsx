"use client";
import React from "react";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";

// Class components can't use the useLocale() hook, so the locale is passed in
// as a prop from the (function) component that mounts this boundary.
const COPY = {
  tr: {
    title: "Bir şeyler ters gitti",
    description: "Bu bölümde bir hata oluştu. Sayfayı yenilemeyi deneyin.",
    reload: "Sayfayı Yenile",
  },
  en: {
    title: "Something went wrong",
    description: "An error occurred in this section. Try refreshing the page.",
    reload: "Refresh Page",
  },
};

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
      const copy = COPY[this.props.locale === "en" ? "en" : "tr"];
      return (
        <div role="alert" className="border-y border-rule py-10">
          <h2 className="font-display text-lg font-semibold text-ink">{copy.title}</h2>
          <p className="mt-1 max-w-measure text-sm text-muted-foreground">
            {copy.description}
          </p>
          <div className="mt-4">
            <Button onClick={() => window.location.reload()}>{copy.reload}</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;