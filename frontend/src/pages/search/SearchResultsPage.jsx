import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, Briefcase, ShoppingBag, Users, Calendar, DollarSign, MapPin } from 'lucide-react';
import SearchService from '../../services/search.service';
import { useTranslation } from 'react-i18next';

/**
 * SearchResultsPage
 * Display search results with tabs and filters
 */
const SearchResultsPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({});
  
  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, filters]);
  
  const performSearch = async () => {
    try {
      setLoading(true);
      const searchResults = await SearchService.search(query, {
        ...filters,
        limit: 20
      });
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getTotalResults = () => {
    if (!results) return 0;
    return (results.projects?.length || 0) +
           (results.services?.length || 0) +
           (results.providers?.length || 0);
  };
  
  const getFilteredResults = () => {
    if (!results) return { projects: [], services: [], providers: [] };
    
    if (activeTab === 'all') return results;
    if (activeTab === 'projects') return { projects: results.projects || [] };
    if (activeTab === 'services') return { services: results.services || [] };
    if (activeTab === 'providers') return { providers: results.providers || [] };
    
    return results;
  };
  
  const tabs = [
    { id: 'all', label: t('search.all', 'All'), count: getTotalResults() },
    { id: 'projects', label: t('search.projects', 'Projects'), count: results?.projects?.length || 0 },
    { id: 'services', label: t('search.services', 'Services'), count: results?.services?.length || 0 },
    { id: 'providers', label: t('search.providers', 'Providers'), count: results?.providers?.length || 0 },
  ];
  
  if (!query) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {t('search.noQuery', 'Search for something')}
          </h2>
          <p className="text-muted-foreground">
            {t('search.noQueryDesc', 'Use the search bar to find projects, services, or providers')}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('search.resultsFor', 'Search results for')} "{query}"
          </h1>
          <p className="text-muted-foreground">
            {loading ? (
              t('search.searching', 'Searching...')
            ) : (
              `${getTotalResults()} ${t('search.resultsFound', 'results found')}`
            )}
          </p>
        </div>
        
        {/* Tabs */}
        <div className="mb-6 border-b border-white/10">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-white/20'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-foreground'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Projects Results */}
            {(activeTab === 'all' || activeTab === 'projects') && results?.projects && results.projects.length > 0 && (
              <ResultSection
                title={t('search.projects', 'Projects')}
                icon={<Briefcase className="h-5 w-5" />}
                items={results.projects}
                renderItem={(project) => <ProjectCard key={project.id} project={project} />}
              />
            )}
            
            {/* Services Results */}
            {(activeTab === 'all' || activeTab === 'services') && results?.services && results.services.length > 0 && (
              <ResultSection
                title={t('search.services', 'Services')}
                icon={<ShoppingBag className="h-5 w-5" />}
                items={results.services}
                renderItem={(service) => <ServiceCard key={service.id} service={service} />}
              />
            )}
            
            {/* Providers Results */}
            {(activeTab === 'all' || activeTab === 'providers') && results?.providers && results.providers.length > 0 && (
              <ResultSection
                title={t('search.providers', 'Providers')}
                icon={<Users className="h-5 w-5" />}
                items={results.providers}
                renderItem={(provider) => <ProviderCard key={provider.id} provider={provider} />}
              />
            )}
            
            {/* No Results */}
            {!loading && getTotalResults() === 0 && (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t('search.noResults', 'No results found')}
                </h3>
                <p className="text-muted-foreground">
                  {t('search.tryDifferent', 'Try a different search term or filter')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Result Section Component
const ResultSection = ({ title, icon, items, renderItem }) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <span className="text-muted-foreground">({items.length})</span>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {items.map(renderItem)}
      </div>
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ project }) => {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block bg-white/5 rounded-xl shadow-sm border border-white/10 p-6 hover:shadow-md hover:bg-white/10 transition-shadow backdrop-blur-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">{project.title}</h3>
          <p className="text-muted-foreground line-clamp-2">{project.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          project.status === 'open' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-foreground'
        }`}>
          {project.status}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {project.client && (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{project.client}</span>
          </div>
        )}
        {project.budget_range && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>{project.budget_range}</span>
          </div>
        )}
        {project.deadline && (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(project.deadline).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </Link>
  );
};

// Service Card Component
const ServiceCard = ({ service }) => {
  return (
    <Link
      to={`/services/${service.id}`}
      className="block bg-white/5 rounded-xl shadow-sm border border-white/10 p-6 hover:shadow-md hover:bg-white/10 transition-shadow backdrop-blur-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">{service.title}</h3>
          <p className="text-muted-foreground line-clamp-2">{service.description}</p>
        </div>
        {service.rating && (
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span className="font-medium">{service.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {service.provider && (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{service.provider}</span>
          </div>
        )}
        {service.base_price && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>From ${service.base_price}</span>
          </div>
        )}
        {service.delivery_time && (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{service.delivery_time} days</span>
          </div>
        )}
      </div>
    </Link>
  );
};

// Provider Card Component
const ProviderCard = ({ provider }) => {
  return (
    <Link
      to={`/profiles/${provider.id}`}
      className="block bg-white/5 rounded-xl shadow-sm border border-white/10 p-6 hover:shadow-md hover:bg-white/10 transition-shadow backdrop-blur-sm"
    >
      <div className="flex items-start gap-4">
        {provider.avatar ? (
          <img
            src={provider.avatar}
            alt={provider.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-semibold">
            {provider.name?.charAt(0) || '?'}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-1">{provider.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{provider.title || 'Service Provider'}</p>
          <p className="text-muted-foreground line-clamp-2">{provider.bio}</p>
          
          <div className="flex flex-wrap gap-2 mt-3">
            {provider.skills?.map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded"
              >
                {skill}
              </span>
            ))}
          </div>
          
        <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            {provider.hourly_rate && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>${provider.hourly_rate}/hr</span>
              </div>
            )}
            {provider.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{provider.location}</span>
              </div>
            )}
            {provider.profile_completeness && (
              <div className="flex items-center gap-1">
                <span className="font-medium">{provider.profile_completeness}%</span>
                <span>complete</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SearchResultsPage;
