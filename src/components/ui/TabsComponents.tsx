import React, { createContext, useContext, useState } from "react";

// Context for managing tab state
interface TabsContextType {
  selectedTab: string;
  setSelectedTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType>({
  selectedTab: "",
  setSelectedTab: () => {},
});

interface TabsProps {
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const Tabs = ({
  value,
  defaultValue,
  onValueChange,
  children,
  className = "",
}: TabsProps) => {
  // For uncontrolled mode
  const [internalValue, setInternalValue] = useState(defaultValue);

  // Determine if we're in controlled or uncontrolled mode
  const isControlled = value !== undefined;
  const selectedTab = isControlled ? value : internalValue;

  const setSelectedTab = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ selectedTab, setSelectedTab }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = "" }: TabsListProps) => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
    >
      {children}
    </div>
  );
};

export const TabsTrigger = ({
  value,
  children,
  className = "",
}: TabsTriggerProps) => {
  const { selectedTab, setSelectedTab } = useContext(TabsContext);
  const isActive = selectedTab === value;

  return (
    <button
      onClick={() => setSelectedTab(value)}
      className={`
        inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 
        ${
          isActive
            ? "bg-background bg-white/30 text-foreground shadow-sm"
            : "hover:bg-background/50 hover:text-foreground"
        } 
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({
  value,
  children,
  className = "",
}: TabsContentProps) => {
  const { selectedTab } = useContext(TabsContext);

  if (selectedTab !== value) return null;

  return (
    <div
      role="tabpanel"
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </div>
  );
};
