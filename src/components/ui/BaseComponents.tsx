import React from "react";
import {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardContentProps,
  ButtonProps,
  InputProps,
  FormLabelProps,
  AlertProps,
  ContainerProps,
  GridProps,
  ButtonVariant,
  ButtonSize,
  GridColumnStyles,
  GridGapStyles,
} from "@/types/components";

// Card Components
export const Card: React.FC<CardProps> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<CardHeaderProps> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<CardTitleProps> = ({
  className = "",
  children,
  ...props
}) => (
  <h3 className={`${className}`} {...props}>
    {children}
  </h3>
);

export const CardContent: React.FC<CardContentProps> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

// Button Component
export const Button: React.FC<ButtonProps> = ({
  variant = "primary" as ButtonVariant,
  size = "md" as ButtonSize,
  className = "",
  children,
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-black text-white focus:ring-black",
    secondary:
      "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-black",
    default: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    ghost: "bg-transparent text-gray-900 hover:bg-gray-100 focus:ring-gray-500",
    link: "bg-transparent text-black hover:underline focus:ring-black",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "p-2",
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Input Component
export const Input: React.FC<InputProps> = ({ className = "", ...props }) => (
  <input
    className={`
      block w-full rounded-md border-gray-300 shadow-sm
      focus:border-blue-500 focus:ring-blue-500
      disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
      sm:text-sm h-12 px-2
      ${className}
    `}
    {...props}
  />
);

// FormLabel Component
export const FormLabel: React.FC<FormLabelProps> = ({
  className = "",
  children,
  ...props
}) => (
  <label
    className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
    {...props}
  >
    {children}
  </label>
);

// Alert Component
export const Alert: React.FC<AlertProps> = ({
  variant = "info",
  className = "",
  children,
  ...props
}) => {
  const variants = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-green-50 text-green-800 border-green-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    error: "bg-red-50 text-red-800 border-red-200",
  };

  return (
    <div
      className={`p-4 rounded-md border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Container Component
export const Container: React.FC<ContainerProps> = ({
  className = "",
  children,
  ...props
}) => (
  <div
    className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Grid Component
export const Grid: React.FC<GridProps> = ({
  columns = 1 as keyof GridColumnStyles,
  gap = 4 as keyof GridGapStyles,
  className = "",
  children,
  ...props
}) => {
  const gapSizes: GridGapStyles = {
    2: "gap-2",
    4: "gap-4",
    6: "gap-6",
    8: "gap-8",
  };

  const gridCols: GridColumnStyles = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div
      className={`grid ${gridCols[columns as keyof GridColumnStyles]} ${
        gapSizes[gap as keyof GridGapStyles]
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
