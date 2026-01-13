import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Users, Briefcase, Shield, Zap, MessageSquare, TrendingUp, Star, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const { t } = useTranslation();
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRegisterClick = () => {
    navigate("/register");
  }
  const browseServices = () => {
    navigate("/browse/services");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div
          className="absolute top-0 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translateY(${scrollY * 0.3}px)` }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ transform: `translateY(-${scrollY * 0.2}px)`, animationDelay: '1s' }}
        ></div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" id='Home'>
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

        <div className="container mx-auto px-4 relative z-10 pt-20">
          <div className="max-w-5xl mx-auto text-center">
            {/* Floating Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">{t('landing.hero.badge')}</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                {t('landing.hero.title1')}
              </span>
              <br />
              <span className="text-white">{t('landing.hero.title2')}</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              {t('landing.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
                onClick={handleRegisterClick}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {t('landing.hero.cta_main')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              <button
                className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all hover:scale-105"
                onClick={browseServices}
              >
                {t('landing.hero.cta_secondary')}
              </button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>{t('landing.hero.note1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>{t('landing.hero.note2')}</span>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/20 rounded-2xl backdrop-blur-sm rotate-12 animate-float"></div>
          <div className="absolute bottom-40 right-20 w-32 h-32 bg-purple-500/20 rounded-full backdrop-blur-sm animate-float-delayed"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 border-y border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <StatCard number="10K+" label={t('landing.stats.activeUsers')} />
            <StatCard number="5K+" label={t('landing.stats.projectsCompleted')} />
            <StatCard number="500+" label={t('landing.stats.serviceProviders')} />
            <StatCard number="95%" label={t('landing.stats.successRate')} />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 relative" id='features'>
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t('landing.features.title')}
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Briefcase className="w-8 h-8" />}
              title={t('landing.features.postProjects.title')}
              description={t('landing.features.postProjects.description')}
              gradient="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title={t('landing.features.browseTalent.title')}
              description={t('landing.features.browseTalent.description')}
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={<MessageSquare className="w-8 h-8" />}
              title={t('landing.features.realTimeChat.title')}
              description={t('landing.features.realTimeChat.description')}
              gradient="from-green-500 to-emerald-500"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title={t('landing.features.aiMatching.title')}
              description={t('landing.features.aiMatching.description')}
              gradient="from-orange-500 to-red-500"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title={t('landing.features.securePayments.title')}
              description={t('landing.features.securePayments.description')}
              gradient="from-indigo-500 to-blue-500"
            />
            <FeatureCard
              icon={<TrendingUp className="w-8 h-8" />}
              title={t('landing.features.growthAnalytics.title')}
              description={t('landing.features.growthAnalytics.description')}
              gradient="from-pink-500 to-rose-500"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent relative" id="how-it-works">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">{t('landing.howItWorks.title')}</h2>
            <p className="text-xl text-slate-400">{t('landing.howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
            {/* For Clients */}
            <div className="space-y-8">
              <h3 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
                {t('landing.howItWorks.forClients')}
              </h3>
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
            <div className="space-y-8">
              <h3 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                {t('landing.howItWorks.forProviders')}
              </h3>
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

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIuNSIgb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-10"></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <Star className="w-16 h-16 mx-auto mb-6 text-yellow-300" />
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto opacity-90">
            {t('landing.cta.subtitle')}
          </p>
          <button
            className="group px-10 py-5 bg-white text-purple-600 rounded-xl font-bold text-lg hover:scale-105 transition-all hover:shadow-2xl hover:shadow-white/50"
            onClick={handleRegisterClick}
          >
            <span className="flex items-center justify-center gap-2">
              {t('landing.cta.button')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          <p className="mt-6 text-white/80">{t('landing.cta.note')}</p>
        </div>
      </section>
    </div>
  );
};

// Component: Feature Card
const FeatureCard = ({ icon, title, description, gradient }) => (
  <div className="group relative bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all hover:scale-105 hover:bg-white/10">
    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-3">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{description}</p>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
  </div>
);

// Component: Step Card
const StepCard = ({ number, title, description }) => (
  <div className="flex gap-5 group">
    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
      {number}
    </div>
    <div>
      <h4 className="font-bold text-xl mb-2">{title}</h4>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

// Component: Stat Card
const StatCard = ({ number, label }) => (
  <div className="text-center group hover:scale-105 transition-transform">
    <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
      {number}
    </div>
    <div className="text-slate-400 font-medium text-lg">{label}</div>
  </div>
);

export default LandingPage;

<style>{`
@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(12deg); }
  50% { transform: translateY(-20px) rotate(12deg); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-30px); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 8s ease-in-out infinite;
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}
`}</style>