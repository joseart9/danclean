"use client";

import * as React from "react";

interface DateRange {
  from: Date;
  to: Date | undefined;
}

interface DateRangeContextType {
  range: DateRange;
  rangeCompare?: DateRange;
  setRange: (range: DateRange) => void;
  setRangeCompare: (rangeCompare: DateRange | undefined) => void;
}

const DateRangeContext = React.createContext<DateRangeContextType | undefined>(
  undefined
);

export function useDateRange() {
  const context = React.useContext(DateRangeContext);
  if (!context) {
    throw new Error("useDateRange must be used within a DateRangeProvider");
  }
  return context;
}

export function DateRangeProvider({ children }: { children: React.ReactNode }) {
  const [range, setRange] = React.useState<DateRange>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      from: today,
      to: today,
    };
  });

  const [rangeCompare, setRangeCompare] = React.useState<DateRange | undefined>(
    undefined
  );

  const value = React.useMemo(
    () => ({
      range,
      rangeCompare,
      setRange,
      setRangeCompare,
    }),
    [range, rangeCompare]
  );

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}

export type { DateRange };
