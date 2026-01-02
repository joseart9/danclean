import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SkeletonDataTableProps {
  columns?: number;
  rows?: number;
  enableSearchOnName?: boolean;
  enableSideButtons?: boolean;
  className?: string;
}

export const SkeletonDataTable = ({
  columns = 4,
  rows = 5,
  enableSearchOnName = true,
  enableSideButtons = true,
  className = "",
}: SkeletonDataTableProps) => {
  return (
    <div className={`w-full ${className} relative`}>
      <div className="transition-all duration-200 ease-linear">
        <div>
          {enableSearchOnName && (
            <div className="pb-4 border-b">
              <Skeleton className="h-10 w-64" />
            </div>
          )}
          <div className="border rounded-md">
            <Table className="w-full">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow className="bg-muted/50 [&>th]:border-t-0">
                  {Array.from({ length: columns }).map((_, index) => (
                    <TableHead key={index} className="relative h-10 border-t">
                      <div className="flex items-center justify-start gap-0.5">
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            </Table>
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
              <Table className="w-full">
                <TableBody>
                  {Array.from({ length: rows }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Array.from({ length: columns }).map((_, colIndex) => (
                        <TableCell key={colIndex} className="truncate">
                          {colIndex === 0 ? (
                            // First column - mimic product/item cell with image and text
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-lg" />
                              <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                              </div>
                            </div>
                          ) : (
                            // Other columns - simple skeleton
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-16" />
                            </div>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
      {enableSideButtons && (
        <div className="absolute top-0 right-0 flex flex-row gap-2 z-10">
          <Skeleton className="h-9 w-32" />
        </div>
      )}
    </div>
  );
};
