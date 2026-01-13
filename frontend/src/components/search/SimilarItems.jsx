import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Briefcase, ShoppingBag, User, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardContent, Badge, Button } from "@/components/ui";
import SearchService from "../../services/search.service";

/**
 * SimilarItems Component
 * Shows AI-powered "Similar to this" recommendations
 */
const SimilarItems = ({ itemType, itemId, title = "Similar Items" }) => {
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (itemType && itemId) fetchSimilarItems();
  }, [itemType, itemId]);

  const fetchSimilarItems = async () => {
    try {
      setLoading(true);
      const response = await SearchService.getSimilarItems(itemType, itemId, 4);
      setSimilar(response.similar_items || []);
    } catch (error) {
      console.error("Failed to fetch similar items:", error);
      setSimilar([]);
    } finally {
      setLoading(false);
    }
  };

  if (!similar || similar.length === 0) return null;

  return (
    <Card className="bg-white/5 border-white/10 text-white rounded-xl">
      <CardHeader className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <Badge variant="secondary" className="ml-auto">AI Powered</Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading
          ? [...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-2 bg-white/10 p-4 rounded-lg">
              <div className="h-4 bg-white/20 rounded w-3/4"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          ))
          : similar.map((item) => <SimilarItemCard key={item.id} item={item} />)}
      </CardContent>
    </Card>
  );
};

const SimilarItemCard = ({ item }) => {
  const getIcon = () => {
    switch (item.type) {
      case "project":
        return <Briefcase className="h-4 w-4" />;
      case "service":
        return <ShoppingBag className="h-4 w-4" />;
      case "provider":
        return <User className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoute = () => {
    switch (item.type) {
      case "project":
        return `/projects/${item.id}`;
      case "service":
        return `/services/${item.id}`;
      case "provider":
        return `/profiles/${item.id}`;
      default:
        return "#";
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case "project":
        return "Project";
      case "service":
        return "Service";
      case "provider":
        return "Provider";
      default:
        return "";
    }
  };

  return (
    <Button asChild variant="ghost" className="w-full justify-start">
      <Link to={getRoute()} className="block w-full">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white/50">{getIcon()}</span>
              <Badge variant="outline">{getTypeLabel()}</Badge>
            </div>
            <h4 className="font-medium text-white truncate">{item.title || item.name}</h4>
            {(item.description || item.bio) && (
              <p className="text-sm text-white/60 line-clamp-2 mt-1">
                {item.description || item.bio}
              </p>
            )}
            <div className="flex gap-3 mt-2 text-green-400 text-xs">
              {item.budget_range && <span>{item.budget_range}</span>}
              {item.base_price && <span>From ${item.base_price}</span>}
              {item.hourly_rate && <span>${item.hourly_rate}/hr</span>}
              {item.rating && (
                <span className="flex items-center gap-1">
                  <span className="text-yellow-400">★</span>
                  {item.rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-white/50 mt-1 transition-transform group-hover:translate-x-1" />
        </div>
      </Link>
    </Button>
  );
};

export default SimilarItems;
