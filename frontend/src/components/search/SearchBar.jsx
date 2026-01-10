import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import SearchService from '../../services/search.service';
import { useTranslation } from 'react-i18next';

/**
 * SearchBar Component
 * Global search bar with autocomplete suggestions
 */
const SearchBar = ({ className = '' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions(null);
      setIsOpen(false);
      return;
    }

    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const fetchSuggestions = async (searchQuery) => {
    try {
      setLoading(true);
      const results = await SearchService.search(searchQuery, { limit: 5 });
      console.log('Search results:', results); // Debug log
      
      // Ensure results have the expected structure
      const formattedResults = {
        projects: results?.projects || [],
        services: results?.services || [],
        providers: results?.providers || []
      };
      
      setSuggestions(formattedResults);
      setIsOpen(true);
    } catch (error) {
      console.error('Search suggestions error:', error);
      setSuggestions({ projects: [], services: [], providers: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query);
      navigate(`/app/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (item) => {
    const routes = {
      project: `/app/projects/${item.id}`,
      service: `/app/services/${item.id}`,
      provider: `/app/profiles/${item.id}`
    };
    
    navigate(routes[item.type] || '/app/search');
    setQuery('');
    setIsOpen(false);
  };

  const saveRecentSearch = (searchQuery) => {
    try {
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updated = [searchQuery, ...recent.filter(q => q !== searchQuery)].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions(null);
    setIsOpen(false);
  };

  const getTotalResults = () => {
    if (!suggestions) return 0;
    return (suggestions.projects?.length || 0) +
           (suggestions.services?.length || 0) +
           (suggestions.providers?.length || 0);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setIsOpen(true)}
            placeholder={t('search.placeholder', 'Search projects, services, providers...')}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions && getTotalResults() > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Projects */}
          {suggestions.projects && suggestions.projects.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                {t('search.projects', 'Projects')} ({suggestions.projects.length})
              </div>
              {suggestions.projects.map((project) => (
                <button
                  key={`project-${project.id}`}
                  onClick={() => handleSuggestionClick({ ...project, type: 'project' })}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{project.title || project.name}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {project.description}
                  </div>
                  {(project.budget_min || project.budget_max) && (
                    <div className="text-xs text-green-600 mt-1">
                      ${project.budget_min || 0} - ${project.budget_max || 'N/A'}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Services */}
          {suggestions.services && suggestions.services.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                {t('search.services', 'Services')} ({suggestions.services.length})
              </div>
              {suggestions.services.map((service) => (
                <button
                  key={`service-${service.id}`}
                  onClick={() => handleSuggestionClick({ ...service, type: 'service' })}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">{service.name || service.title}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {service.description}
                  </div>
                  {service.packages?.[0]?.price && (
                    <div className="text-xs text-green-600 mt-1">
                      From ${service.packages[0].price}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Providers */}
          {suggestions.providers && suggestions.providers.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                {t('search.providers', 'Providers')} ({suggestions.providers.length})
              </div>
              {suggestions.providers.map((provider) => (
                <button
                  key={`provider-${provider.id}`}
                  onClick={() => handleSuggestionClick({ ...provider, type: 'provider' })}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {provider.avatar ? (
                      <img
                        src={provider.avatar}
                        alt={provider.name || 'Provider'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                        {(provider.name || '?').charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {provider.name || 'Provider'}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {provider.headline || 'Service Provider'}
                      </div>
                      {provider.hourly_rate && (
                        <div className="text-xs text-green-600 mt-1">
                          ${provider.hourly_rate}/hr
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* View All Results */}
          <div className="p-2 border-t border-gray-100">
            <button
              onClick={() => {
                navigate(`/app/search?q=${encodeURIComponent(query)}`);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-center text-sm font-medium text-primary hover:bg-gray-50 rounded-md transition-colors"
            >
              {t('search.viewAll', 'View all results')} ({getTotalResults()})
            </button>
          </div>
        </div>
      )}

      {/* No Results */}
      {isOpen && suggestions && getTotalResults() === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center">
          <p className="text-gray-500">
            {t('search.noResults', 'No results found for')} "{query}"
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
