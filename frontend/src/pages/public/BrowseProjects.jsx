import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar, DollarSign, MapPin, ArrowRight, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/contexts/authStore';
import api from '@/lib/api';

const BrowseProjects = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['public-projects', searchQuery],
    queryFn: async () => {
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await api.get('/projects/', { params });
      return response.data;
    },
  });

  const projects = projectsData?.results || [];

  const handleProjectClick = (projectId) => {
    if (isAuthenticated) {
      navigate(`/app/projects/${projectId}`);
    } else {
      // Store intended destination and redirect to login
      sessionStorage.setItem('redirectAfterLogin', `/app/projects/${projectId}`);
      navigate('/login', { state: { message: 'Please sign in to view project details and submit bids.' } });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      open: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800',
      closed: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.draft;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Browse Projects
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Find exciting opportunities and submit your bids to win projects
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </Card>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">No projects found</p>
              <Link to="/register">
                <Button>Post your first project</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold flex-1">{project.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status?.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {project.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {project.budget && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">${project.budget.toLocaleString()}</span>
                      </div>
                    )}
                    {project.deadline && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(project.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                    {project.category && (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{project.category}</span>
                      </div>
                    )}
                    {project.bid_count !== undefined && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{project.bid_count} bids</span>
                      </div>
                    )}
                  </div>

                  {project.created_by_name && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        Posted by <span className="font-medium text-foreground">{project.created_by_name}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  {!isAuthenticated && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground text-center">
                        Sign in to view details and submit a bid
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* CTA for non-authenticated users */}
          {!isAuthenticated && projects.length > 0 && (
            <div className="mt-16 text-center bg-secondary/30 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to start bidding?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Create an account to submit bids, communicate with clients, and win exciting projects
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

export default BrowseProjects;
