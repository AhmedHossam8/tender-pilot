import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Users, Briefcase, Shield, Zap, MessageSquare, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Connect. Collaborate. Create.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              ServiceHub is where talented professionals meet exciting projects. 
              Whether you're a client seeking expertise or a provider showcasing your skills, we bring the right people together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="text-lg px-8 py-6">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/browse/services">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Browse Services
                </Button>
              </Link>
            </div>
            <div className="flex gap-4 justify-center mt-6">
              <Link to="/browse/projects">
                <Button variant="ghost" className="text-primary">
                  View Projects →
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Free to join • Start in minutes
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Choose ServiceHub?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete marketplace built for modern professionals
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Briefcase className="h-8 w-8" />}
              title="Post Projects, Get Bids"
              description="Describe your project needs and receive competitive bids from qualified service providers within hours."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Browse Services"
              description="Explore a curated marketplace of professional services. Book experts directly for fixed-price packages."
            />
            <FeatureCard
              icon={<MessageSquare className="h-8 w-8" />}
              title="Seamless Communication"
              description="Built-in messaging keeps all project discussions organized and secure in one place."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="AI-Powered Matching"
              description="Our smart algorithms connect you with the perfect match based on skills, experience, and project requirements."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Secure & Reliable"
              description="Verified profiles, reviews, and ratings ensure you work with trusted professionals every time."
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title="Grow Your Business"
              description="Service providers can showcase portfolios, build reputation, and access a steady stream of quality projects."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How ServiceHub Works</h2>
            <p className="text-lg text-muted-foreground">Simple, transparent, and efficient</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* For Clients */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-primary mb-6">For Clients</h3>
              <StepCard
                number="1"
                title="Post Your Project"
                description="Describe what you need, set your budget, and define your timeline."
              />
              <StepCard
                number="2"
                title="Review Proposals"
                description="Receive bids from qualified providers and compare their offers."
              />
              <StepCard
                number="3"
                title="Choose & Collaborate"
                description="Select the best fit and work together through our platform."
              />
              <StepCard
                number="4"
                title="Pay Securely"
                description="Release payment when satisfied with the delivered work."
              />
            </div>

            {/* For Providers */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-primary mb-6">For Service Providers</h3>
              <StepCard
                number="1"
                title="Create Your Profile"
                description="Showcase your skills, portfolio, and what makes you unique."
              />
              <StepCard
                number="2"
                title="Find Projects"
                description="Browse opportunities or create service listings clients can book."
              />
              <StepCard
                number="3"
                title="Submit Proposals"
                description="Bid on projects that match your expertise with competitive offers."
              />
              <StepCard
                number="4"
                title="Deliver & Earn"
                description="Complete the work, get paid, and build your reputation."
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-center">About ServiceHub</h2>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                ServiceHub was born from a simple idea: the best work happens when the right people connect. 
                In today's digital world, talent knows no boundaries, and neither should opportunity.
              </p>
              <p>
                We're more than a marketplace—we're a community where clients find the perfect expertise for their projects, 
                and service providers discover meaningful work that matches their skills. Whether you're looking to hire a 
                developer, designer, writer, consultant, or any other professional, or you're a freelancer seeking your next opportunity, 
                ServiceHub is your launchpad.
              </p>
              <p>
                Our platform combines powerful AI-driven matching with human-centered design to make collaboration effortless. 
                We've eliminated the friction from traditional hiring and freelancing, creating a space where quality work and 
                fair compensation meet.
              </p>
              <div className="bg-card p-8 rounded-lg border border-border mt-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">Our Mission</h3>
                <p className="text-foreground">
                  To empower professionals worldwide by creating meaningful connections that drive success. 
                  We believe everyone deserves access to opportunities that match their talents and ambitions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
            <StatCard number="10,000+" label="Active Users" />
            <StatCard number="5,000+" label="Projects Completed" />
            <StatCard number="500+" label="Service Providers" />
            <StatCard number="95%" label="Success Rate" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of professionals already collaborating on ServiceHub. 
            Your next great project or opportunity is just a click away.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Create Your Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

// Component: Feature Card
const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-card p-6 rounded-lg border border-border hover:border-primary transition-colors">
    <div className="text-primary mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

// Component: Step Card
const StepCard = ({ number, title, description }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
      {number}
    </div>
    <div>
      <h4 className="font-bold text-lg mb-1">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

// Component: Stat Card
const StatCard = ({ number, label }) => (
  <div>
    <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{number}</div>
    <div className="text-muted-foreground font-medium">{label}</div>
  </div>
);

export default LandingPage;
