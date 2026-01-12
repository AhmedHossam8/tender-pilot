import React, { useState } from 'react';
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
  Search
} from 'lucide-react';

const HelpPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      articles: [
        'How to create your first project',
        'Setting up your profile',
        'Understanding user roles',
        'Navigating the dashboard'
      ]
    },
    {
      id: 'for-clients',
      title: 'For Clients',
      icon: FileText,
      articles: [
        'How to post a project',
        'Reviewing and accepting bids',
        'Managing your projects',
        'Payment and invoicing'
      ]
    },
    {
      id: 'for-providers',
      title: 'For Service Providers',
      icon: MessageCircle,
      articles: [
        'How to submit a bid',
        'Creating service listings',
        'Building your portfolio',
        'Getting more projects'
      ]
    },
    {
      id: 'account',
      title: 'Account & Billing',
      icon: HelpCircle,
      articles: [
        'Managing your account',
        'Changing your password',
        'Notification settings',
        'Billing and subscriptions'
      ]
    }
  ];

  const handleContactSupport = () => {
    toast.success('Support request submitted! We\'ll get back to you within 24 hours.');
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Help & Support</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Find answers to common questions and get the help you need
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg"
            />
          </div>
        </div>

        {/* Help Categories */}
        {!selectedCategory ? (
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
                          {article}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Category Details */
          <div className="mb-12">
            <Button
              variant="ghost"
              onClick={() => setSelectedCategory(null)}
              className="mb-6"
              disabled={setSelectedCategory === null || setSelectedCategory === undefined}
            >
              ← Back to categories
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{selectedCategory.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {selectedCategory.articles.map((article, idx) => (
                    <li
                      key={idx}
                      className="p-4 border border-border rounded-lg hover:border-primary cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{article}</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Still Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="support-email">Your Email</Label>
                <Input id="support-email" type="email" placeholder="your@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-subject">Subject</Label>
                <Input id="support-subject" placeholder="What do you need help with?" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-message">Message</Label>
              <textarea
                id="support-message"
                className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-background"
                placeholder="Describe your issue in detail..."
              />
            </div>
            <Button onClick={handleContactSupport} disabled={handleContactSupport.isPending}>
              {handleContactSupport.isPending ? ('Sending...') : 'Send Message'}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
          <div className="p-6 border border-border rounded-lg">
            <Mail className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Email Support</h3>
            <p className="text-sm text-muted-foreground mb-3">support@servicehub.com</p>
            <p className="text-xs text-muted-foreground">Response within 24 hours</p>
          </div>
          <div className="p-6 border border-border rounded-lg">
            <MessageCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Live Chat</h3>
            <p className="text-sm text-muted-foreground mb-3">Available Mon-Fri</p>
            <p className="text-xs text-muted-foreground">9 AM - 5 PM EST</p>
          </div>
          <div className="p-6 border border-border rounded-lg">
            <BookOpen className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Documentation</h3>
            <p className="text-sm text-muted-foreground mb-3">Detailed guides</p>
            <p className="text-xs text-muted-foreground">Step-by-step tutorials</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
