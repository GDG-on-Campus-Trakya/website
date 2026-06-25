"use client";
import React from "react";
import { logger } from "@/utils/logger";

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
        <div className="flex flex-col items-center justify-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">{copy.title}</h2>
          <p className="text-[#d1d1e0] text-center mb-4">
            {copy.description}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {copy.reload}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;