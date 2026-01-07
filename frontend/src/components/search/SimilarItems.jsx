import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Briefcase, ShoppingBag, User, ChevronRight } from 'lucide-react';
import SearchService from '../../services/search.service';

/**
 * SimilarItems Component
 * Shows AI-powered "Similar to this" recommendations
 */
const SimilarItems = ({ itemType, itemId, title = "Similar Items" }) => {
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (itemType && itemId) {
      fetchSimilarItems();
    }
  }, [itemType, itemId]);

  const fetchSimilarItems = async () => {
    try {
      setLoading(true);
      const response = await SearchService.getSimilarItems(itemType, itemId, 4);
      setSimilar(response.similar_items || []);
    } catch (error) {
      console.error('Failed to fetch similar items:', error);
      setSimilar([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!similar || similar.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
          AI Powered
        </span>
      </div>

      <div className="space-y-3">
        {similar.map((item) => (
          <SimilarItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

const SimilarItemCard = ({ item }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'project':
        return <Briefcase className="h-4 w-4" />;
      case 'service':
        return <ShoppingBag className="h-4 w-4" />;
      case 'provider':
        return <User className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoute = () => {
    switch (item.type) {
      case 'project':
        return `/projects/${item.id}`;
      case 'service':
        return `/services/${item.id}`;
      case 'provider':
        return `/profiles/${item.id}`;
      default:
        return '#';
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case 'project':
        return 'Project';
      case 'service':
        return 'Service';
      case 'provider':
        return 'Provider';
      default:
        return '';
    }
  };

  return (
    <Link
      to={getRoute()}
      className="block p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-400 group-hover:text-primary transition-colors">
              {getIcon()}
            </span>
            <span className="text-xs text-gray-500 uppercase font-medium">
              {getTypeLabel()}
            </span>
          </div>
          <h4 className="font-medium text-gray-900 group-hover:text-primary transition-colors truncate">
            {item.title || item.name}
          </h4>
          {item.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {item.description}
            </p>
          )}
          {item.bio && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {item.bio}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
      </div>

      {/* Additional info */}
      <div className="flex gap-3 mt-2 text-xs text-gray-500">
        {item.budget_range && (
          <span className="text-green-600">{item.budget_range}</span>
        )}
        {item.base_price && (
          <span className="text-green-600">From ${item.base_price}</span>
        )}
        {item.hourly_rate && (
          <span className="text-green-600">${item.hourly_rate}/hr</span>
        )}
        {item.rating && (
          <span className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            {item.rating.toFixed(1)}
          </span>
        )}
      </div>
    </Link>
  );
};

export default SimilarItems;
