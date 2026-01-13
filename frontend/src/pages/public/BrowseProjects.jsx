import React, { useState } from 'react';
import { Search, Calendar, DollarSign, MapPin, ArrowRight, Briefcase, TrendingUp, Clock, Users, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/contexts/authStore';
import api from '@/lib/api';
import { SearchBar as CommonSearchBar } from '@/components/common';

const BrowseProjects = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['public-projects', searchQuery],
    queryFn: async () => {
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await api.get('/projects/', { params });
      return response.data;
    },
  });

  const projects = projectsData?.results || [];

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-slate-500/20 text-slate-300',
      open: 'bg-green-500/20 text-green-300',
      in_progress: 'bg-blue-500/20 text-blue-300',
      completed: 'bg-purple-500/20 text-purple-300',
      closed: 'bg-red-500/20 text-red-300',
    };
    return colors[status] || colors.draft;
  };

  const filteredProjects = projects;

  const handleProjectClick = (projectId) => {
    if (isAuthenticated) {
      navigate(`/app/projects/${projectId}`);
    } else {
      sessionStorage.setItem(
        'redirectAfterLogin',
        `/app/projects/${projectId}`
      );
      navigate('/login', {
        state: {
          message: 'Please sign in to view project details and submit bids.',
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute top-0 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      {/* Header Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm mb-6">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">Live Projects</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Browse Projects
              </span>
            </h1>

            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Discover real opportunities posted by verified clients
            </p>

            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <CommonSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={setSearchQuery}
                placeholder="Search projects..."
                className="mt-2"
              />
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 mt-8 flex-wrap text-slate-400">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                <span>{projects.length} Projects</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span>High Demand</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span>Verified Clients</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="text-center py-20 text-slate-400">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-10 h-10 mx-auto mb-4 text-slate-400" />
              <h3 className="text-2xl font-bold mb-2">No Projects Found</h3>
              <p className="text-slate-400 mb-6">Try a different keyword</p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project.id)}
                  className="group bg-white/5 rounded-2xl border border-white/10 p-6 hover:scale-[1.02] transition cursor-pointer"
                >
                  <div className="flex justify-between mb-4">
                    <h3 className="text-xl font-bold group-hover:text-blue-400">
                      {project.title}
                    </h3>
                    <span className={`px-3 py-1 text-xs rounded ${getStatusColor(project.status)}`}>
                      {project.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <p className="text-slate-400 mb-6 line-clamp-3">
                    {project.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    {project.budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        ${project.budget.toLocaleString()}
                      </div>
                    )}
                    {project.deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        {new Date(project.deadline).toLocaleDateString()}
                      </div>
                    )}
                    {project.category && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-purple-400" />
                        {typeof project.category === 'object'
                          ? project.category.name
                          : project.category}
                      </div>
                    )}
                    {project.bid_count !== undefined && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-400" />
                        {project.bid_count} bids
                      </div>
                    )}
                  </div>

                  {project.created_by_name && (
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                      <span className="text-sm text-slate-400">
                        Posted by <strong>{project.created_by_name}</strong>
                      </span>
                      <ArrowRight className="text-blue-400 group-hover:translate-x-1 transition" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          {!isAuthenticated && projects.length > 0 && (
            <div className="mt-20 text-center bg-blue-600/20 rounded-2xl p-12 max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold mb-4">Ready to Start Bidding?</h3>
              <p className="text-slate-300 mb-8">
                Create an account to submit proposals and win projects
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/register" className="px-8 py-4 bg-blue-600 rounded-xl font-semibold">
                  Create Account
                </Link>
                <Link to="/login" className="px-8 py-4 border border-white/20 rounded-xl">
                  Sign In
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

<style>{`
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-pulse {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
`}</style>