// types.ts
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

// Common base props interface
interface BaseProps {
  className?: string;
  children?: ReactNode;
}

// Card component types
export interface CardProps extends HTMLAttributes<HTMLDivElement>, BaseProps {}

export interface CardHeaderProps
  extends HTMLAttributes<HTMLDivElement>,
    BaseProps {}

export interface CardTitleProps
  extends HTMLAttributes<HTMLHeadingElement>,
    BaseProps {}

export interface CardContentProps
  extends HTMLAttributes<HTMLDivElement>,
    BaseProps {}

// Button component types
export type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "outline"
  | "destructive"
  | "ghost"
  | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

// Input component types
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  error?: boolean;
  fullWidth?: boolean;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

// Form label types
export interface FormLabelProps
  extends LabelHTMLAttributes<HTMLLabelElement>,
    BaseProps {
  required?: boolean;
  optional?: boolean;
  error?: boolean;
  htmlFor?: string;
}

// Alert types
export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps extends HTMLAttributes<HTMLDivElement>, BaseProps {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  icon?: ReactNode;
  onClose?: () => void;
}

// Container types
export interface ContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    BaseProps {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: boolean;
}

// Grid types
export interface GridProps extends HTMLAttributes<HTMLDivElement>, BaseProps {
  columns?: number | { [key: string]: number }; // Responsive columns object
  gap?: number | { [key: string]: number }; // Responsive gap sizes
  alignItems?: "start" | "center" | "end" | "stretch";
  justifyItems?: "start" | "center" | "end" | "stretch";
  autoFlow?: "row" | "column";
  autoRows?: string;
  autoColumns?: string;
  templateRows?: string;
  templateColumns?: string;
  dense?: boolean;
}

export interface GridGapStyles {
  2: string;
  4: string;
  6: string;
  8: string;
}

export interface GridColumnStyles {
  1: string;
  2: string;
  3: string;
  4: string;
}
