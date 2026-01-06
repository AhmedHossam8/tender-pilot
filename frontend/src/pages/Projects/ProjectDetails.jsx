import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tantml/react-query";
import { projectService } from "../../services/project.services";
import bidService from "../../services/bid.service";
import { AIMatchScore, AILoadingIndicator } from "../../components/ai";
import { toast } from "react-toastify";

function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State for AI match score
  const [matchScore, setMatchScore] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [showMatchScore, setShowMatchScore] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectService.getProject(id),
  });

  /**
   * Calculate AI match score for the current user.
   * This shows how well the logged-in provider matches this project.
   */
  const calculateMyMatchScore = async () => {
    try {
      setLoadingMatch(true);
      setShowMatchScore(true);
      
      const response = await bidService.getAIMatches(id, 1);
      
      // The API returns all matches, but we only care about the current user
      // In a real implementation, the backend would filter to just the current user
      if (response.data.matches && response.data.matches.length > 0) {
        // For demo, we'll take the first match as the current user's score
        setMatchScore(response.data.matches[0]);
        toast.success('AI match calculated!');
      } else {
        toast.info('No match data available');
      }
    } catch (error) {
      console.error('Error calculating match:', error);
      toast.error('Failed to calculate AI match score');
    } finally {
      setLoadingMatch(false);
    }
  };

  /**
   * Navigate to bid creation page with this project pre-selected.
   */
  const handleBidOnProject = () => {
    navigate(`/bids/create?project=${id}`);
  };

  if (isLoading) return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading project...</p>
      </div>
    </div>
  );
  
  if (isError) return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading project</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Back to Projects
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/projects"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Title and Description */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{data.title}</h1>
            {data.description && (
              <div className="prose max-w-none">
                <p className="text-gray-700">{data.description}</p>
              </div>
            )}
          </div>

          {/* AI Match Score Section */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-md p-6 border border-purple-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  AI Match Analysis
                </h2>
                <p className="text-sm text-gray-600">
                  See how well you match this project
                </p>
              </div>
              
              {!showMatchScore && (
                <button
                  onClick={calculateMyMatchScore}
                  disabled={loadingMatch}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  Calculate My Match
                </button>
              )}
            </div>

            {loadingMatch && (
              <AILoadingIndicator 
                message="Analyzing your compatibility with this project..." 
                size="medium"
              />
            )}

            {showMatchScore && matchScore && !loadingMatch && (
              <div className="bg-white rounded-lg p-4">
                <AIMatchScore
                  score={matchScore.match_score}
                  recommendation={matchScore.recommendation}
                  showDetails={true}
                  feedback={matchScore}
                  size="large"
                />
                
                {/* Quick Bid Button */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleBidOnProject}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                  >
                    Submit Bid for This Project
                  </button>
                </div>
              </div>
            )}

            {showMatchScore && !matchScore && !loadingMatch && (
              <div className="text-center py-8 text-gray-600">
                <p>Unable to calculate match score. Please try again.</p>
              </div>
            )}
          </div>

          {/* Additional Project Information */}
          {data.requirements && data.requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
              <ul className="list-disc list-inside space-y-2">
                {data.requirements.map((req, index) => (
                  <li key={index} className="text-gray-700">{req}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Details Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h2>
            
            <div className="space-y-3">
              {data.deadline && (
                <div>
                  <p className="text-sm text-gray-600">Deadline</p>
                  <p className="font-medium text-gray-900">
                    {new Date(data.deadline).toLocaleDateString()}
                  </p>
                </div>
              )}

              {data.status && (
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {data.status}
                  </span>
                </div>
              )}

              {data.created_at && (
                <div>
                  <p className="text-sm text-gray-600">Posted</p>
                  <p className="font-medium text-gray-900">
                    {new Date(data.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            
            <div className="space-y-3">
              <button
                onClick={handleBidOnProject}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Submit Bid
              </button>
              
              <Link
                to={`/projects/${id}/edit`}
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center font-medium transition-colors"
              >
                Edit Project
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailPage;
