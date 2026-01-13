import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Input } from "./Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";

function DataTable({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  pagination = true,
  sorting = true,
  pageSize = 10,
  className,
}) {
  const { t } = useTranslation();
  const defaultSearchPlaceholder = searchPlaceholder || t("common.search");
  const [sortingState, setSortingState] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: sorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSortingState,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting: sortingState,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className={cn("space-y-4 text-white", className)}>
      {/* Search */}
      {searchKey && (
        <div className="flex items-center">
          <Input
            placeholder={defaultSearchPlaceholder}
            value={table.getColumn(searchKey)?.getFilterValue() ?? ""}
            onChange={(event) =>
              table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm bg-white/5 text-white placeholder:text-slate-400 backdrop-blur-sm border border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-sm">
        <Table className="min-w-full">
          <TableHeader className="bg-gradient-to-r from-[#101825]/30 via-[#163566]/30 to-[#020617]/30 text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort() && "cursor-pointer select-none"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorting && header.column.getCanSort() && (
                          <span className="ml-1">
                            {{
                              asc: <ChevronUp className="h-4 w-4 text-white" />,
                              desc: <ChevronDown className="h-4 w-4 text-white" />,
                            }[header.column.getIsSorted()] ?? (
                                <ChevronsUpDown className="h-4 w-4 opacity-50 text-white" />
                              )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-white/10 transition-colors rounded-lg"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-400">
                  {t("common.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-slate-400">
            {t("common.showing", {
              from: table.getState().pagination.pageIndex * pageSize + 1,
              to: Math.min(
                (table.getState().pagination.pageIndex + 1) * pageSize,
                table.getFilteredRowModel().rows.length
              ),
              total: table.getFilteredRowModel().rows.length,
            })}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="text-white border-white/10 hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("common.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="text-white border-white/10 hover:border-primary hover:text-primary"
            >
              {t("common.next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable };
