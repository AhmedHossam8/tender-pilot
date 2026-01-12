/*
 * Help & Support Page
 * 
 * This page provides comprehensive help documentation and support functionality.
 * 
 * EmailJS Setup Instructions:
 * 1. Install EmailJS: npm install @emailjs/browser
 * 2. Create an EmailJS account at https://www.emailjs.com/
 * 3. Create a service (Gmail, Outlook, etc.)
 * 4. Create an email template with variables: {{from_email}}, {{subject}}, {{message}}, {{to_name}}, {{from_name}}
 * 5. Get your service ID, template ID, and public key from EmailJS dashboard
 * 6. Replace the placeholder values in emailjsConfig below
 * 7. Uncomment the emailjs.send() function call
 * 8. Import emailjs: import emailjs from '@emailjs/browser'
 * 
 * Features:
 * - Comprehensive help articles with full content
 * - Search functionality across all articles
 * - Category-based navigation
 * - Individual article view with reading time
 * - Contact form with EmailJS integration (ready to use)
 * - Responsive design for mobile and desktop
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import { 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Mail, 
  FileText,
  ChevronRight,
  Search,
  ArrowLeft,
  Clock,
  User
} from 'lucide-react';

const HelpPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [contactForm, setContactForm] = useState({
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const articlesData = {
    'getting-started': {
      id: 'getting-started',
      title: t('help.categories.gettingStarted'),
      icon: BookOpen,
      articles: [
        {
          id: 'create-first-project',
          title: t('help.articles.createFirstProject.title'),
          content: t('help.articles.createFirstProject.content'),
          tags: ['projects', 'gettingStarted', 'create'],
          readTime: 5
        },
        {
          id: 'setup-profile',
          title: t('help.articles.setupProfile.title'),
          content: t('help.articles.setupProfile.content'),
          tags: ['profile', 'setup', 'verification'],
          readTime: 7
        },
        {
          id: 'user-roles',
          title: t('help.articles.userRoles.title'),
          content: t('help.articles.userRoles.content'),
          tags: ['roles', 'permissions', 'account'],
          readTime: 4
        },
        {
          id: 'navigate-dashboard',
          title: t('help.articles.navigateDashboard.title'),
          content: t('help.articles.navigateDashboard.content'),
          tags: ['dashboard', 'navigation', 'interface'],
          readTime: 6
        }
      ]
    },
    'for-clients': {
      id: 'for-clients',
      title: t('help.categories.forClients'),
      icon: FileText,
      articles: [
        {
          id: 'post-project',
          title: t('help.articles.postProject.title'),
          content: t('help.articles.postProject.content'),
          tags: ['projects', 'posting', 'requirements'],
          readTime: 8
        },
        {
          id: 'review-bids',
          title: t('help.articles.reviewBids.title'),
          content: t('help.articles.reviewBids.content'),
          tags: ['bids', 'selection', 'evaluation'],
          readTime: 7
        },
        {
          id: 'manage-projects',
          title: t('help.articles.manageProjects.title'),
          content: t('help.articles.manageProjects.content'),
          tags: ['management', 'communication', 'milestones'],
          readTime: 6
        },
        {
          id: 'payment-invoicing',
          title: t('help.articles.paymentInvoicing.title'),
          content: t('help.articles.paymentInvoicing.content'),
          tags: ['payment', 'invoicing', 'escrow'],
          readTime: 9
        }
      ]
    },
    'for-providers': {
      id: 'for-providers',
      title: t('help.categories.forProviders'),
      icon: MessageCircle,
      articles: [
        {
          id: 'submit-bid',
          title: t('help.articles.submitBid.title'),
          content: t('help.articles.submitBid.content'),
          tags: ['bidding', 'proposals', 'winningWork'],
          readTime: 10
        },
        {
          id: 'create-services',
          title: t('help.articles.createServices.title'),
          content: t('help.articles.createServices.content'),
          tags: ['services', 'listings', 'marketplace'],
          readTime: 8
        },
        {
          id: 'build-portfolio',
          title: t('help.articles.buildPortfolio.title'),
          content: t('help.articles.buildPortfolio.content'),
          tags: ['portfolio', 'showcase', 'projects'],
          readTime: 12
        },
        {
          id: 'get-more-projects',
          title: t('help.articles.getMoreProjects.title'),
          content: t('help.articles.getMoreProjects.content'),
          tags: ['success', 'strategy', 'growth'],
          readTime: 11
        }
      ]
    },
    'account': {
      id: 'account',
      title: t('help.categories.account'),
      icon: HelpCircle,
      articles: [
        {
          id: 'manage-account',
          title: t('help.articles.manageAccount.title'),
          content: t('help.articles.manageAccount.content'),
          tags: ['account', 'settings', 'security'],
          readTime: 7
        },
        {
          id: 'change-password',
          title: t('help.articles.changePassword.title'),
          content: t('help.articles.changePassword.content'),
          tags: ['password', 'security', '2fa'],
          readTime: 5
        },
        {
          id: 'notification-settings',
          title: t('help.articles.notificationSettings.title'),
          content: t('help.articles.notificationSettings.content'),
          tags: ['notifications', 'preferences', 'alerts'],
          readTime: 6
        },
        {
          id: 'billing-subscriptions',
          title: t('help.articles.billingSubscriptions.title'),
          content: t('help.articles.billingSubscriptions.content'),
          tags: ['billing', 'subscriptions', 'fees'],
          readTime: 8
        }
      ]
    }
  };

  const categories = Object.values(articlesData);

  // Search functionality
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const allArticles = [];
    
    Object.values(articlesData).forEach(category => {
      category.articles.forEach(article => {
        const matchesTitle = article.title.toLowerCase().includes(query);
        const matchesContent = article.content.toLowerCase().includes(query);
        const matchesTags = article.tags.some(tag => tag.toLowerCase().includes(query));
        
        if (matchesTitle || matchesContent || matchesTags) {
          allArticles.push({ ...article, categoryTitle: category.title });
        }
      });
    });
    
    return allArticles;
  }, [searchQuery]);

  // EmailJS integration for contact form
  const handleContactSupport = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // EmailJS configuration - replace with your actual EmailJS details
      const emailjsConfig = {
        serviceId: 'service_tender_pilot', // Replace with your EmailJS service ID
        templateId: 'template_support', // Replace with your EmailJS template ID
        publicKey: 'your_public_key_here' // Replace with your EmailJS public key
      };
      
      // EmailJS send function - uncomment when EmailJS is set up
      /*
      await emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        {
          from_email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message,
          to_name: 'Tender Pilot Support',
          from_name: contactForm.email,
        },
        emailjsConfig.publicKey
      );
      */
      
      // Simulate success for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(t('help.successMessage'));
      setContactForm({ email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Failed to send support email:', error);
      toast.error(t('help.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setContactForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const translateTag = (tag) => {
    return t(`help.tags.${tag}`, tag);
  };

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
  };

  const formatContent = (content) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h4 key={index} className="font-semibold mt-4 mb-2">{line.slice(2, -2)}</h4>;
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 mb-1">{line.slice(2)}</li>;
      } else if (line.trim() === '') {
        return <br key={index} />;
      } else {
        return <p key={index} className="mb-2 leading-relaxed">{line}</p>;
      }
    });
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t('help.title')}</h1>
          <p className="text-lg text-muted-foreground mb-8">
            {t('help.subtitle')}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('help.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg"
            />
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-12">
            <Button
              variant="ghost"
              onClick={() => setSearchQuery('')}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('help.clearSearch')}
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>{t('help.searchResults')} ({filteredArticles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredArticles.length > 0 ? (
                  <div className="space-y-3">
                    {filteredArticles.map((article) => (
                      <div
                        key={article.id}
                        className="p-4 border border-border rounded-lg hover:border-primary cursor-pointer transition-colors"
                        onClick={() => handleArticleClick(article)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">{article.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {t('help.in')} {article.categoryTitle}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {article.readTime} {t('help.readTime')}
                              </div>
                              <div className="flex gap-1">
                                {article.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="bg-muted px-2 py-1 rounded">
                                    {translateTag(tag)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">{t('help.noResults')} "{searchQuery}"</p>
                    <p className="text-sm text-muted-foreground mt-1">Try different keywords or browse categories</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Article Detail View */}
        {selectedArticle && !searchQuery ? (
          <div className="mb-12">
            <Button
              variant="ghost"
              onClick={() => setSelectedArticle(null)}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {selectedCategory?.title || 'articles'}
            </Button>
            <Card>
              <CardHeader>
                <div className="space-y-2">
                  <CardTitle className="text-3xl">{selectedArticle.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedArticle.readTime} {t('help.readTime')}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {t('help.contact.tenderPilotTeam')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedArticle.tags.map(tag => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {translateTag(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  {formatContent(selectedArticle.content)}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Help Categories */}
            {!selectedCategory && !searchQuery && (
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Card
                      key={category.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedCategory(category)}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <CardTitle className="text-xl">{category.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {category.articles.slice(0, 3).map((article, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ChevronRight className="h-4 w-4" />
                              {article.title}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-muted-foreground mt-3">
                          {category.articles.length} {t('help.articlesCount')}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Category Details */}
            {selectedCategory && !searchQuery && !selectedArticle && (
              <div className="mb-12">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCategory(null)}
                  className="mb-6"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t('help.backToCategories')}
                </Button>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{selectedCategory.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedCategory.articles.map((article, idx) => (
                        <div
                          key={idx}
                          className="p-4 border border-border rounded-lg hover:border-primary cursor-pointer transition-colors"
                          onClick={() => handleArticleClick(article)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">{article.title}</h4>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {article.readTime} {t('help.readTime')}
                                </div>
                                <div className="flex gap-1">
                                  {article.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="bg-muted px-2 py-1 rounded">
                                      {translateTag(tag)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('help.stillNeedHelp')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t('help.contactDescription')}
            </p>
            <form onSubmit={handleContactSupport} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="support-email">{t('help.yourEmail')}</Label>
                  <Input 
                    id="support-email" 
                    type="email" 
                    placeholder="your@email.com"
                    value={contactForm.email}
                    onChange={handleInputChange('email')}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-subject">{t('help.subject')}</Label>
                  <Input 
                    id="support-subject" 
                    placeholder={t('help.subjectPlaceholder')}
                    value={contactForm.subject}
                    onChange={handleInputChange('subject')}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-message">{t('help.message')}</Label>
                <textarea
                  id="support-message"
                  className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-background"
                  placeholder={t('help.messagePlaceholder')}
                  value={contactForm.message}
                  onChange={handleInputChange('message')}
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || !contactForm.email || !contactForm.subject || !contactForm.message}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? t('help.sending') : t('help.sendMessage')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6 border border-border rounded-lg">
            <Mail className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">{t('help.contact.emailSupport')}</h3>
            <p className="text-sm text-muted-foreground mb-3">support@servicehub.com</p>
            <p className="text-xs text-muted-foreground">{t('help.contact.responseTime')}</p>
          </div>
          <div className="p-6 border border-border rounded-lg">
            <MessageCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">{t('help.contact.liveChat')}</h3>
            <p className="text-sm text-muted-foreground mb-3">{t('help.contact.availability')}</p>
            <p className="text-xs text-muted-foreground">{t('help.contact.hours')}</p>
          </div>
          <div className="p-6 border border-border rounded-lg">
            <BookOpen className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">{t('help.contact.documentation')}</h3>
            <p className="text-sm text-muted-foreground mb-3">{t('help.contact.detailedGuides')}</p>
            <p className="text-xs text-muted-foreground">{t('help.contact.stepByStep')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
