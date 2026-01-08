import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, DollarSign, Star, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/contexts/authStore';
import api from '@/lib/api';

const BrowseServices = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['public-services', searchQuery],
    queryFn: async () => {
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await api.get('/services/', { params });
      return response.data;
    },
  });

  const services = servicesData?.results || [];

  const handleServiceClick = (serviceId) => {
    if (isAuthenticated) {
      navigate(`/app/services/${serviceId}`);
    } else {
      // Store intended destination and redirect to login
      sessionStorage.setItem('redirectAfterLogin', `/app/services/${serviceId}`);
      navigate('/login', { state: { message: 'Please sign in to view service details and book services.' } });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Browse Services
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Discover talented professionals ready to help with your next project
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </Card>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">No services found</p>
              <Link to="/register">
                <Button>Be the first to offer a service</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleServiceClick(service.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold flex-1">{service.title}</h3>
                    {service.average_rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{service.average_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">${service.base_price}</span>
                    </div>
                    {service.delivery_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{service.delivery_time} days</span>
                      </div>
                    )}
                  </div>

                  {service.provider_name && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        by <span className="font-medium text-foreground">{service.provider_name}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  {!isAuthenticated && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground text-center">
                        Sign in to view details and book this service
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* CTA for non-authenticated users */}
          {!isAuthenticated && services.length > 0 && (
            <div className="mt-16 text-center bg-secondary/30 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Create an account to book services, communicate with providers, and manage your projects
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/register">
                  <Button size="lg">Create Account</Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">Sign In</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default BrowseServices;
