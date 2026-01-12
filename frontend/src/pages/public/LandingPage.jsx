import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Users, Briefcase, Shield, Zap, MessageSquare, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';

const LandingPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('landing.hero.title')}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="text-base lg:text-lg px-6 lg:px-8 py-4 lg:py-6 w-full sm:w-auto">
                  {t('landing.hero.getStarted')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/browse/services">
                <Button size="lg" variant="outline" className="text-base lg:text-lg px-6 lg:px-8 py-4 lg:py-6 w-full sm:w-auto">
                  {t('landing.hero.browseServices')}
                </Button>
              </Link>
            </div>
            <div className="flex gap-4 justify-center mt-6">
              <Link to="/browse/projects">
                <Button variant="ghost" className="text-primary">
                  {t('landing.hero.viewProjects')} →
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {t('landing.hero.noCredit')}
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4">{t('landing.features.title')}</h2>
            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Briefcase className="h-8 w-8" />}
              title={t('landing.features.postProjects.title')}
              description={t('landing.features.postProjects.description')}
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title={t('landing.features.browseServices.title')}
              description={t('landing.features.browseServices.description')}
            />
            <FeatureCard
              icon={<MessageSquare className="h-8 w-8" />}
              title={t('landing.features.communication.title')}
              description={t('landing.features.communication.description')}
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title={t('landing.features.aiMatching.title')}
              description={t('landing.features.aiMatching.description')}
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title={t('landing.features.security.title')}
              description={t('landing.features.security.description')}
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title={t('landing.features.growth.title')}
              description={t('landing.features.growth.description')}
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4">{t('landing.howItWorks.title')}</h2>
            <p className="text-base lg:text-lg text-muted-foreground">{t('landing.howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* For Clients */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-primary mb-6">{t('landing.howItWorks.forClients')}</h3>
              <StepCard
                number="1"
                title={t('landing.howItWorks.clients.step1.title')}
                description={t('landing.howItWorks.clients.step1.description')}
              />
              <StepCard
                number="2"
                title={t('landing.howItWorks.clients.step2.title')}
                description={t('landing.howItWorks.clients.step2.description')}
              />
              <StepCard
                number="3"
                title={t('landing.howItWorks.clients.step3.title')}
                description={t('landing.howItWorks.clients.step3.description')}
              />
              <StepCard
                number="4"
                title={t('landing.howItWorks.clients.step4.title')}
                description={t('landing.howItWorks.clients.step4.description')}
              />
            </div>

            {/* For Providers */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-primary mb-6">{t('landing.howItWorks.forProviders')}</h3>
              <StepCard
                number="1"
                title={t('landing.howItWorks.providers.step1.title')}
                description={t('landing.howItWorks.providers.step1.description')}
              />
              <StepCard
                number="2"
                title={t('landing.howItWorks.providers.step2.title')}
                description={t('landing.howItWorks.providers.step2.description')}
              />
              <StepCard
                number="3"
                title={t('landing.howItWorks.providers.step3.title')}
                description={t('landing.howItWorks.providers.step3.description')}
              />
              <StepCard
                number="4"
                title={t('landing.howItWorks.providers.step4.title')}
                description={t('landing.howItWorks.providers.step4.description')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-center">{t('landing.about.title')}</h2>
            <div className="space-y-6 text-lg text-muted-foreground">
              <p>
                {t('landing.about.intro')}
              </p>
              <p>
                {t('landing.about.description')}
              </p>
              <p>
                {t('landing.about.platform')}
              </p>
              <div className="bg-card p-8 rounded-lg border border-border mt-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">{t('landing.about.mission.title')}</h3>
                <p className="text-foreground">
                  {t('landing.about.mission.description')}
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
            <StatCard number="10,000+" label={t('landing.stats.activeUsers')} />
            <StatCard number="5,000+" label={t('landing.stats.projectsCompleted')} />
            <StatCard number="500+" label={t('landing.stats.serviceProviders')} />
            <StatCard number="95%" label={t('landing.stats.successRate')} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            {t('landing.cta.subtitle')}
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              {t('landing.cta.button')}
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
