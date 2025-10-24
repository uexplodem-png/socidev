import React from "react";
import { AlertCircle, X } from "lucide-react";

interface FormErrorProps {
    error: string;
    onDismiss?: () => void;
    variant?: "default" | "field";
}

/**
 * Professional error display component
 * Shows errors in a clean, organized way
 */
export const FormError: React.FC<FormErrorProps> = ({
    error,
    onDismiss,
    variant = "default",
}) => {
    if (!error) return null;

    // Split multi-line errors into an array
    const errorLines = error.split("\n").filter((line) => line.trim());

    if (variant === "field") {
        // Compact field error
        return (
            <p className="text-xs text-red-400 mt-1">{error}</p>
        );
    }

    // Default: Professional alert display
    return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <div className="flex gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {errorLines.length === 1 ? (
                        // Single error line
                        <p className="text-sm text-red-400 leading-relaxed">{errorLines[0]}</p>
                    ) : (
                        // Multiple error lines - organized list
                        <div className="space-y-1.5">
                            {errorLines.map((line, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <span className="text-red-400 text-sm leading-relaxed">{line}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Dismiss button */}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
                        aria-label="Dismiss error"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default FormError;
