"use client";

// Components
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  DateRangeProvider,
  useDateRange,
} from "@/providers/date-range-provider";
import { usePathname } from "next/navigation";

function HeaderContent() {
  const pathname = usePathname();
  const isActive = pathname === "/" || pathname === "/expenses";
  const { range, rangeCompare, setRange, setRangeCompare } = useDateRange();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 px-4">
        {isActive && (
          <>
            <DateRangePicker
              initialDateFrom={range.from}
              initialDateTo={range.to}
              initialCompareFrom={rangeCompare?.from}
              initialCompareTo={rangeCompare?.to}
              onUpdate={({
                range: newRange,
                rangeCompare: newRangeCompare,
              }) => {
                setRange(newRange);
                setRangeCompare(newRangeCompare);
              }}
            />
          </>
        )}
        <ThemeSwitcher />
      </div>
    </header>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DateRangeProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <>
            <HeaderContent />
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-screen rounded-b-xl md:min-h-min  overflow-auto">
              {children}
            </div>
          </>
        </SidebarInset>
      </SidebarProvider>
    </DateRangeProvider>
  );
}
