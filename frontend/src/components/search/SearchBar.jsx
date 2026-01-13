import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Card, CardHeader, CardContent, CardTitle, Badge } from "../ui";
import SearchService from "../../services/search.service";
import { useTranslation } from "react-i18next";

/**
 * SearchBar Component
 * Global search bar with autocomplete suggestions
 */
const SearchBar = ({ className = "" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  /** Close dropdown when clicking outside */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** Fetch suggestions with debounce */
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions(null);
      setIsOpen(false);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchSuggestions(query), 300);

    return () => clearTimeout(debounceTimer.current);
  }, [query]);

  /** Fetch search results */
  const fetchSuggestions = async (q) => {
    try {
      setLoading(true);
      const results = await SearchService.search(q, { limit: 5 });

      const formatted = {
        projects: results?.projects || [],
        services: results?.services || [],
        providers: results?.providers || [],
      };

      setSuggestions(formatted);
      setIsOpen(true);
      setHighlightIndex(-1);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions({ projects: [], services: [], providers: [] });
    } finally {
      setLoading(false);
    }
  };

  /** Save query to recent searches */
  const saveRecentSearch = (q) => {
    try {
      const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      const updated = [q, ...recent.filter((r) => r !== q)].slice(0, 10);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save search:", error);
    }
  };

  /** Handle form submit */
  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    saveRecentSearch(query);
    navigate(`/app/search?q=${encodeURIComponent(query)}`);
    setIsOpen(false);
    setQuery("");
  };

  /** Handle suggestion click */
  const handleSuggestionClick = (item) => {
    const routes = {
      project: `/app/projects/${item.id}`,
      service: `/app/services/${item.id}`,
      provider: `/app/profiles/${item.id}`,
    };
    navigate(routes[item.type] || "/app/search");
    setQuery("");
    setIsOpen(false);
  };

  /** Clear input */
  const clearQuery = () => {
    setQuery("");
    setSuggestions(null);
    setIsOpen(false);
  };

  /** Keyboard navigation */
  const handleKeyDown = (e) => {
    if (!isOpen || !suggestions) return;

    const allItems = [
      ...(suggestions.projects || []).map((i) => ({ ...i, type: "project" })),
      ...(suggestions.services || []).map((i) => ({ ...i, type: "service" })),
      ...(suggestions.providers || []).map((i) => ({ ...i, type: "provider" })),
    ];

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(allItems[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightIndex(-1);
    }
  };

  const flattenedSuggestions = useMemo(() => {
    if (!suggestions) return [];
    return [
      ...(suggestions.projects || []).map((i) => ({ ...i, type: "project" })),
      ...(suggestions.services || []).map((i) => ({ ...i, type: "service" })),
      ...(suggestions.providers || []).map((i) => ({ ...i, type: "provider" })),
    ];
  }, [suggestions]);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Input */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-200 pointer-events-none filter-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t("search.placeholder", "Search projects, services, providers...")}
          className="w-full pl-10 pr-10 py-2.5 rounded-full bg-slate-900/70 text-white placeholder:text-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white animate-spin" />
        ) : query ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0 text-white/70 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && flattenedSuggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-sm">
          <CardContent className="space-y-2">
            {flattenedSuggestions.map((item, index) => (
              <Button
                key={`${item.type}-${item.id}`}
                variant={highlightIndex === index ? "secondary" : "default"}
                size="default"
                className="w-full justify-start text-left rounded-lg"
                onClick={() => handleSuggestionClick(item)}
              >
                <div className="flex items-center gap-3">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.name || "Provider"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                      {(item.name || "?").charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">
                      {item.name || item.title}
                    </div>
                    {item.description && (
                      <div className="text-sm text-slate-400 truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
              </Button>
            ))}

            {/* View All */}
            <Button
              variant="ghost"
              size="default"
              className="w-full justify-center text-blue-400 mt-2 hover:bg-white/10"
              onClick={() => {
                navigate(`/app/search?q=${encodeURIComponent(query)}`);
                setIsOpen(false);
              }}
            >
              {t("search.viewAll", "View all results")} ({flattenedSuggestions.length})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {isOpen && flattenedSuggestions.length === 0 && !loading && (
        <Card className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-sm p-4 text-center">
          <p className="text-white">
            {t("search.noResults", "No results found for")} "{query}"
          </p>
        </Card>
      )}
    </div>
  );
};

export default SearchBar;
