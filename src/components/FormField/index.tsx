"use client";

import React from "react";
import { Info } from "lucide-react";

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  tooltip?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  children,
  tooltip,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-400 dark:text-gray-300">
          {label}
        </label>
        {tooltip && (
          <div className="group relative">
            <Info className="h-4 w-4 text-gray-400 hover:text-gray-500 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
