import * as React from "react";
import { cn } from "@/lib/utils";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useTranslation } from "react-i18next";

function FilterPanel({ filters, activeFilters = {}, onFilterChange, onClearFilters, className }) {
  const { t } = useTranslation();

  const activeFilterCount = Object.values(activeFilters).filter(
    (value) => value !== undefined && value !== "" && value !== null && !(Array.isArray(value) && value.length === 0)
  ).length;

  const handleFilterChange = (key, value) => {
    onFilterChange?.({
      ...activeFilters,
      [key]: value,
    });
  };

  const handleClearAll = () => {
    onClearFilters?.();
  };

  return (
    <div className={cn("bg-card border rounded-lg max-h-96 overflow-y-auto", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{t('filters')}</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{t('activeFilters', { count: activeFilterCount })}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              {t('clearAll')}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filters.map((filter) => (
            <div key={filter.key} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{filter.label}</label>

              {filter.type === "select" && (
                <Select
                  value={activeFilters[filter.key] || ""}
                  onValueChange={(value) => handleFilterChange(filter.key, value)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={t('all')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('all')}</SelectItem>
                    {filter.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {(filter.type === "text" || filter.type === "number") && (
                <Input
                  type={filter.type}
                  value={activeFilters[filter.key] || ""}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  placeholder={filter.placeholder}
                  className="h-9 text-sm"
                />
              )}

              {filter.type === "select-multiple" && (
                <div className="space-y-2">
                  {filter.options?.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={(activeFilters[filter.key] || []).includes(option.value)}
                        onChange={(e) => {
                          const current = activeFilters[filter.key] || [];
                          const newValue = e.target.checked
                            ? [...current, option.value]
                            : current.filter((v) => v !== option.value);
                          handleFilterChange(filter.key, newValue);
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { FilterPanel };
