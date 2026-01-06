"use client";

import type { CSSProperties } from "react";
import { useState, useId } from "react";

import {
  ChevronDownIcon,
  ChevronUpIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  GripVerticalIcon,
  Package,
  SearchIcon,
} from "lucide-react";

import Papa from "papaparse";
import * as XLSX from "xlsx";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  Cell,
  ColumnDef,
  ColumnFiltersState,
  Header,
  SortingState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSidebar } from "@/components/ui/sidebar";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  enableColumnReordering?: boolean;
  enableSorting?: boolean;
  enableSortingRemoval?: boolean;
  enableColumnResizing?: boolean;
  enableSearchOnName?: boolean;
  searchOnNamePlaceholder?: string;
  enableExport?: boolean;
  exportFilename?: string;
  className?: string;
  emptyMessage?: string;
  sideButtons?: React.ReactNode;
  onRowClick?: (row: TData) => void;
}

const DataTable = <TData,>({
  data,
  columns,
  enableColumnReordering = false,
  enableSorting = true,
  enableSortingRemoval = false,
  enableColumnResizing = false,
  enableSearchOnName = true,
  enableExport = false,
  searchOnNamePlaceholder = "Buscar por nombre...",
  exportFilename = "data-export",
  className = "",
  emptyMessage = "No results.",
  sideButtons,
  onRowClick,
}: DataTableProps<TData>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string)
  );
  const [rowSelection, setRowSelection] = useState({});
  const dndId = useId();

  // Get sidebar state to calculate proper container width
  const { state, isMobile } = useSidebar();

  // Calculate max width based on sidebar state
  const getMaxWidth = () => {
    if (!enableColumnResizing || isMobile) return undefined;

    if (state === "collapsed") {
      // Sidebar is collapsed to icon (3rem)
      return "calc(100vw - 3rem)";
    } else {
      // Sidebar is expanded (16rem)
      return "calc(100vw - 16rem - 2.5rem)";
    }
  };

  // Check if there's a "name" column
  const hasNameColumn = columns.some((column) => {
    return (
      column.id === "name" ||
      ("accessorKey" in column && column.accessorKey === "name")
    );
  });

  // Show search input if enabled and name column exists
  const showSearch = enableSearchOnName && hasNameColumn;

  // Helper function to get export data with only visible columns and proper headers
  const getExportData = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const rowsToExport =
      selectedRows.length > 0 ? selectedRows : table.getFilteredRowModel().rows;

    // Get visible columns (excluding selection, actions, etc.)
    const visibleColumns = table.getVisibleLeafColumns().filter((col) => {
      const columnDef = col.columnDef;
      // Exclude columns without accessorKey or id (like selection checkboxes)
      return (
        ("accessorKey" in columnDef && columnDef.accessorKey) ||
        ("accessorFn" in columnDef && columnDef.accessorFn) ||
        columnDef.id ||
        col.id
      );
    });

    // Transform data to only include visible columns with proper headers
    return rowsToExport.map((row) => {
      const exportRow: Record<string, unknown> = {};
      visibleColumns.forEach((col) => {
        const columnDef = col.columnDef;

        // Get header text
        let header = "";
        if (typeof columnDef.header === "string") {
          header = columnDef.header;
        } else if (columnDef.id) {
          header = columnDef.id;
        } else if (col.id) {
          header = col.id;
        }

        // Get the raw value from the row data
        let value: unknown;
        if ("accessorFn" in columnDef && columnDef.accessorFn) {
          value = columnDef.accessorFn(row.original, row.index);
        } else if ("accessorKey" in columnDef && columnDef.accessorKey) {
          // Use accessorKey to get value directly from original data
          const key = columnDef.accessorKey as string;
          value = (row.original as Record<string, unknown>)[key];
        } else if (columnDef.id || col.id) {
          // Try to get value using the column id
          value = row.getValue(col.id);
        } else {
          value = row.getValue(col.id);
        }

        // Format the value based on the column type/formatting
        // For now, export the raw value - the column definitions should handle formatting
        // Users can format in Excel/CSV if needed, or we can add formatting logic here

        // Handle null/undefined
        if (value === null || value === undefined) {
          exportRow[header] = "";
        } else if (typeof value === "object") {
          // For objects (like dates), convert to string
          if (value instanceof Date) {
            exportRow[header] = value.toISOString();
          } else {
            exportRow[header] = JSON.stringify(value);
          }
        } else {
          exportRow[header] = value;
        }
      });
      return exportRow;
    });
  };

  // Export functions
  const exportToCSV = () => {
    const dataToExport = getExportData();

    const csv = Papa.unparse(dataToExport, {
      header: true,
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${exportFilename}-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const dataToExport = getExportData();

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    // Auto-size columns based on visible columns
    const visibleColumns = table.getVisibleLeafColumns();
    const colsWidth = visibleColumns.map(() => ({ wch: 20 }));
    worksheet["!cols"] = colsWidth;

    XLSX.writeFile(
      workbook,
      `${exportFilename}-${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const exportToJSON = () => {
    const dataToExport = getExportData();

    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${exportFilename}-${new Date().toISOString().split("T")[0]}.json`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Set initial column sizes with "name" column being larger
  const getInitialColumnSizes = () => {
    const sizes: Record<string, number> = {};
    columns.forEach((column) => {
      const columnId = column.id as string;
      if (
        columnId === "name" ||
        ("accessorKey" in column && column.accessorKey === "name")
      ) {
        sizes[columnId] = 300; // Make name column larger
      } else {
        sizes[columnId] = 150; // Default size for other columns
      }
    });
    return sizes;
  };

  const table = useReactTable({
    data,
    columns,
    ...(enableColumnResizing && { columnResizeMode: "onChange" }),
    initialState: {
      columnSizing: getInitialColumnSizes(),
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnOrder,
      rowSelection,
    },
    onColumnOrderChange: setColumnOrder,
    enableSortingRemoval,
    enableSorting,
  });

  function handleDragEnd(event: DragEndEvent) {
    if (!enableColumnReordering) return;

    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      setColumnOrder((columnOrder) => {
        const oldIndex = columnOrder.indexOf(active.id as string);
        const newIndex = columnOrder.indexOf(over.id as string);

        return arrayMove(columnOrder, oldIndex, newIndex);
      });
    }
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const tableContent = (
    <Table
      className={enableColumnResizing ? "table-fixed w-full" : "w-full"}
      style={
        enableColumnResizing
          ? {
              width: `${table.getCenterTotalSize()}px`,
              minWidth: "100%",
            }
          : undefined
      }
    >
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow
            key={headerGroup.id}
            className="bg-muted/50 [&>th]:border-t-0"
          >
            {enableColumnReordering ? (
              <SortableContext
                items={columnOrder}
                strategy={horizontalListSortingStrategy}
              >
                {headerGroup.headers.map((header) => (
                  <DraggableTableHeader
                    key={header.id}
                    header={header}
                    enableSorting={enableSorting}
                    enableColumnResizing={enableColumnResizing}
                  />
                ))}
              </SortableContext>
            ) : (
              headerGroup.headers.map((header) => (
                <StaticTableHeader
                  key={header.id}
                  header={header}
                  enableSorting={enableSorting}
                  enableColumnResizing={enableColumnResizing}
                />
              ))
            )}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              onClick={() => onRowClick?.(row.original)}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
            >
              {enableColumnReordering
                ? row.getVisibleCells().map((cell) => (
                    <SortableContext
                      key={cell.id}
                      items={columnOrder}
                      strategy={horizontalListSortingStrategy}
                    >
                      <DragAlongCell
                        key={cell.id}
                        cell={cell}
                        enableColumnResizing={enableColumnResizing}
                      />
                    </SortableContext>
                  ))
                : row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="truncate"
                      style={
                        enableColumnResizing
                          ? { width: cell.column.getSize() }
                          : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground">
                  {emptyMessage}
                </h3>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className={`w-full ${className} relative`}>
      <div
        className="transition-all duration-200 ease-linear"
        style={getMaxWidth() ? { maxWidth: getMaxWidth() } : undefined}
      >
        <div
          className={
            !showSearch && ((enableExport && data.length > 0) || sideButtons)
              ? "pt-12"
              : ""
          }
        >
          {showSearch && (
            <div className="pb-4 border-b">
              <Input
                placeholder={searchOnNamePlaceholder}
                className="w-64"
                value={
                  (table.getColumn("name")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                leftIcon={<SearchIcon className="size-4" />}
              />
            </div>
          )}
          <div className={enableColumnResizing ? "overflow-x-auto" : ""}>
            {enableColumnReordering ? (
              <DndContext
                id={dndId}
                collisionDetection={closestCenter}
                modifiers={[restrictToHorizontalAxis]}
                onDragEnd={handleDragEnd}
                sensors={sensors}
              >
                {tableContent}
              </DndContext>
            ) : (
              tableContent
            )}
          </div>
        </div>
      </div>
      {((enableExport && data.length > 0) || sideButtons) && (
        <div className="absolute top-0 right-0 flex flex-row gap-2 z-10">
          {enableExport && data.length > 0 && (
            <div className="flex items-center space-x-2">
              {table.getSelectedRowModel().rows.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {table.getSelectedRowModel().rows.length} de{" "}
                  {table.getFilteredRowModel().rows.length} sel.
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="default">
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Exportar como CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToExcel}>
                    <FileSpreadsheetIcon className="mr-2 h-4 w-4" />
                    Exportar como Excel
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportToJSON}>
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    Exportar como JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          {sideButtons}
        </div>
      )}
    </div>
  );
};

const DraggableTableHeader = <TData,>({
  header,
  enableSorting,
  enableColumnResizing,
}: {
  header: Header<TData, unknown>;
  enableSorting: boolean;
  enableColumnResizing: boolean;
}) => {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: header.column.id,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition,
    whiteSpace: "nowrap",
    ...(enableColumnResizing && { width: header.column.getSize() }),
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <TableHead
      ref={setNodeRef}
      className={`before:bg-border relative h-10 border-t before:absolute before:inset-y-0 before:left-0 before:w-px first:before:bg-transparent ${
        enableColumnResizing
          ? "group/head select-none last:[&>.cursor-col-resize]:opacity-0"
          : ""
      }`}
      style={style}
      aria-sort={
        header.column.getIsSorted() === "asc"
          ? "ascending"
          : header.column.getIsSorted() === "desc"
          ? "descending"
          : "none"
      }
    >
      <div className="flex items-center justify-start gap-0.5">
        <Button
          size="icon"
          variant="ghost"
          className="-ml-2 size-7 shadow-none"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVerticalIcon
            className="opacity-60"
            size={16}
            aria-hidden="true"
          />
        </Button>
        <span className="grow truncate">
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </span>
        {enableSorting && (
          <Button
            size="icon"
            variant="ghost"
            className="group -mr-1 size-7 shadow-none"
            onClick={header.column.getToggleSortingHandler()}
            onKeyDown={(e) => {
              if (
                header.column.getCanSort() &&
                (e.key === "Enter" || e.key === " ")
              ) {
                e.preventDefault();
                header.column.getToggleSortingHandler()?.(e);
              }
            }}
            aria-label="Toggle sorting"
          >
            {{
              asc: (
                <ChevronUpIcon
                  className="shrink-0 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
              ),
              desc: (
                <ChevronDownIcon
                  className="shrink-0 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
              ),
            }[header.column.getIsSorted() as string] ?? (
              <ChevronUpIcon
                className="shrink-0 opacity-0 group-hover:opacity-60"
                size={16}
                aria-hidden="true"
              />
            )}
          </Button>
        )}
      </div>
      {enableColumnResizing && header.column.getCanResize() && (
        <div
          onDoubleClick={() => header.column.resetSize()}
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className="group-last/head:hidden absolute top-0 h-full w-4 cursor-col-resize user-select-none touch-none -right-2 z-10 flex justify-center before:absolute before:w-px before:inset-y-0 before:bg-border before:translate-x-px"
        />
      )}
    </TableHead>
  );
};

const StaticTableHeader = <TData,>({
  header,
  enableSorting,
  enableColumnResizing,
}: {
  header: Header<TData, unknown>;
  enableSorting: boolean;
  enableColumnResizing: boolean;
}) => {
  return (
    <TableHead
      className={`before:bg-border relative h-10 border-t before:absolute before:inset-y-0 before:left-0 before:w-px first:before:bg-transparent font-bold uppercase ${
        enableColumnResizing
          ? "group/head select-none last:[&>.cursor-col-resize]:opacity-0"
          : ""
      }`}
      style={
        enableColumnResizing
          ? {
              width: header.column.getSize(),
            }
          : undefined
      }
      aria-sort={
        header.column.getIsSorted() === "asc"
          ? "ascending"
          : header.column.getIsSorted() === "desc"
          ? "descending"
          : "none"
      }
    >
      <div className="flex items-center justify-start gap-0.5">
        <span className="grow truncate">
          {header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())}
        </span>
        {enableSorting && (
          <Button
            size="icon"
            variant="ghost"
            className="group -mr-1 size-7 shadow-none"
            onClick={header.column.getToggleSortingHandler()}
            onKeyDown={(e) => {
              if (
                header.column.getCanSort() &&
                (e.key === "Enter" || e.key === " ")
              ) {
                e.preventDefault();
                header.column.getToggleSortingHandler()?.(e);
              }
            }}
            aria-label="Toggle sorting"
          >
            {{
              asc: (
                <ChevronUpIcon
                  className="shrink-0 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
              ),
              desc: (
                <ChevronDownIcon
                  className="shrink-0 opacity-60"
                  size={16}
                  aria-hidden="true"
                />
              ),
            }[header.column.getIsSorted() as string] ?? (
              <ChevronUpIcon
                className="shrink-0 opacity-0 group-hover:opacity-60"
                size={16}
                aria-hidden="true"
              />
            )}
          </Button>
        )}
      </div>
      {enableColumnResizing && header.column.getCanResize() && (
        <div
          onDoubleClick={() => header.column.resetSize()}
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className="group-last/head:hidden absolute top-0 h-full w-4 cursor-col-resize user-select-none touch-none -right-2 z-10 flex justify-center before:absolute before:w-px before:inset-y-0 before:bg-border before:translate-x-px"
        />
      )}
    </TableHead>
  );
};

const DragAlongCell = <TData,>({
  cell,
  enableColumnResizing,
}: {
  cell: Cell<TData, unknown>;
  enableColumnResizing: boolean;
}) => {
  const { isDragging, setNodeRef, transform, transition } = useSortable({
    id: cell.column.id,
  });

  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: "relative",
    transform: CSS.Translate.toString(transform),
    transition,
    ...(enableColumnResizing && { width: cell.column.getSize() }),
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <TableCell ref={setNodeRef} className="truncate" style={style}>
      {flexRender(cell.column.columnDef.cell, cell.getContext())}
    </TableCell>
  );
};

export { DataTable };
export type { DataTableProps };
