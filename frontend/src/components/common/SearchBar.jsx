import * as React from "react";
import { cn, debounce } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";

function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder,
  className,
  debounceMs = 300,
  showClear = true,
}) {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = React.useState(value || "");

  // Debounced search
  const debouncedSearch = React.useMemo(
    () =>
      debounce((searchValue) => {
        onSearch?.(searchValue);
      }, debounceMs),
    [onSearch, debounceMs]
  );

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange?.(newValue);
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    setLocalValue("");
    onChange?.("");
    onSearch?.("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(localValue);
  };

  // Sync with external value
  React.useEffect(() => {
    if (value !== undefined && value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      {/* Search Icon */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

      {/* Input */}
      <Input
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder || t("search")}
        className="pl-10 pr-10 rounded-lg"
      />

      {/* Clear Button */}
      {showClear && localValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
          aria-label={t("clear_search", "Clear search")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}

export { SearchBar };
