import React from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
    password: string;
    showRequirements?: boolean;
}

interface PasswordRequirement {
    label: string;
    test: (pwd: string) => boolean;
}

const requirements: PasswordRequirement[] = [
    {
        label: "At least 8 characters",
        test: (pwd) => pwd.length >= 8,
    },
    {
        label: "Contains uppercase letter (A-Z)",
        test: (pwd) => /[A-Z]/.test(pwd),
    },
    {
        label: "Contains lowercase letter (a-z)",
        test: (pwd) => /[a-z]/.test(pwd),
    },
    {
        label: "Contains number (0-9)",
        test: (pwd) => /\d/.test(pwd),
    },
];

export const PasswordStrengthIndicator: React.FC<PasswordStrengthProps> = ({
    password,
    showRequirements = true,
}) => {
    const passedRequirements = requirements.filter((req) => req.test(password)).length;
    const totalRequirements = requirements.length;
    const strength = Math.round((passedRequirements / totalRequirements) * 100);

    const getStrengthColor = () => {
        if (strength === 0) return "bg-gray-600";
        if (strength <= 25) return "bg-red-500";
        if (strength <= 50) return "bg-orange-500";
        if (strength <= 75) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getStrengthLabel = () => {
        if (strength === 0) return "No requirements met";
        if (strength <= 25) return "Weak";
        if (strength <= 50) return "Fair";
        if (strength <= 75) return "Good";
        return "Strong";
    };

    const isPasswordValid = strength === 100;

    return (
        <div className="space-y-3">
            {/* Strength Bar */}
            {password && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Password strength</span>
                        <span
                            className={`text-xs font-semibold ${isPasswordValid
                                    ? "text-green-400"
                                    : strength <= 25
                                        ? "text-red-400"
                                        : strength <= 50
                                            ? "text-orange-400"
                                            : strength <= 75
                                                ? "text-yellow-400"
                                                : "text-green-400"
                                }`}
                        >
                            {getStrengthLabel()}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getStrengthColor()} transition-all duration-300`}
                            style={{ width: `${strength}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Requirements Checklist */}
            {showRequirements && password && (
                <div className="bg-black/40 border border-gray-700/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-300 mb-2">Password requirements:</p>
                    {requirements.map((req, idx) => {
                        const isMet = req.test(password);
                        return (
                            <div
                                key={idx}
                                className="flex items-center gap-2 text-xs transition-colors"
                            >
                                <div
                                    className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isMet
                                            ? "bg-green-500/20 border-green-500 text-green-400"
                                            : "bg-gray-700/30 border-gray-600 text-gray-500"
                                        }`}
                                >
                                    {isMet ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                </div>
                                <span
                                    className={`${isMet ? "text-gray-300" : "text-gray-500"
                                        }`}
                                >
                                    {req.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
