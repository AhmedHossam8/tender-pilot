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
      title: 'Getting Started',
      icon: BookOpen,
      articles: [
        {
          id: 'create-first-project',
          title: 'How to create your first project',
          content: `Creating your first project on Tender Pilot is simple and straightforward.

**Step 1: Navigate to Projects**
Click on "Projects" in the main navigation menu, then select "Create New Project".

**Step 2: Fill in Project Details**
- Enter a clear, descriptive project title
- Write a detailed description of what you need
- Set your budget range
- Choose the project category
- Add any relevant skills or technologies needed

**Step 3: Set Timeline and Requirements**
- Specify your desired start and end dates
- Add any specific requirements or deliverables
- Upload any relevant files or documents

**Step 4: Publish Your Project**
Review all details and click "Publish Project" to make it visible to service providers.

**Tips for Success:**
- Be as detailed as possible in your description
- Set realistic budgets and timelines
- Respond promptly to questions from providers
- Use clear, professional language`,
          tags: ['projects', 'getting started', 'create'],
          readTime: 5
        },
        {
          id: 'setup-profile',
          title: 'Setting up your profile',
          content: `A complete profile helps build trust and attracts better opportunities.

**Profile Basics**
- Upload a professional profile picture
- Write a compelling bio that highlights your experience
- Add your location and time zone
- Set your hourly rate (for service providers)

**Skills and Experience**
- Add relevant skills and technologies
- Include your experience level for each skill
- Upload portfolio items or previous work samples
- Add certifications or relevant education

**Verification**
- Verify your email address
- Complete identity verification if available
- Link social media profiles (optional)

**Privacy Settings**
- Choose what information is public
- Set notification preferences
- Configure communication settings

**Pro Tips:**
- Keep your profile updated regularly
- Use keywords that clients might search for
- Include examples of your best work
- Write in a professional but personable tone`,
          tags: ['profile', 'setup', 'verification'],
          readTime: 7
        },
        {
          id: 'user-roles',
          title: 'Understanding user roles',
          content: `Tender Pilot has different user roles with specific capabilities.

**Client Role**
Clients can:
- Post new projects
- Review and accept bids
- Manage ongoing projects
- Rate and review service providers
- Access project analytics

**Service Provider Role**
Service providers can:
- Browse available projects
- Submit bids and proposals
- Offer services in the marketplace
- Build a portfolio
- Communicate with clients

**Admin Role**
Administrators have access to:
- Platform-wide analytics
- User management tools
- System settings
- Moderation capabilities

**Switching Roles**
Users can be both clients and service providers by updating their account type in settings.

**Role-Specific Features**
Each role has a customized dashboard showing relevant information and available actions.`,
          tags: ['roles', 'permissions', 'account'],
          readTime: 4
        },
        {
          id: 'navigate-dashboard',
          title: 'Navigating the dashboard',
          content: `The dashboard is your central hub for managing all activities.

**Main Navigation**
- Dashboard: Overview of your activity
- Projects: Create and manage projects
- Messages: Communication center
- Profile: Manage your account
- Analytics: View performance data (admin only)

**Dashboard Widgets**
- Recent activity feed
- Active projects summary
- Pending notifications
- Quick action buttons
- Performance metrics

**Customization**
- Rearrange widgets by dragging
- Hide/show specific sections
- Set default landing page
- Choose between light/dark theme

**Mobile Navigation**
The mobile interface provides the same functionality with a hamburger menu for easy access on smaller screens.

**Keyboard Shortcuts**
- Ctrl/Cmd + K: Quick search
- Ctrl/Cmd + N: New project
- Ctrl/Cmd + M: Messages
- Ctrl/Cmd + P: Profile`,
          tags: ['dashboard', 'navigation', 'interface'],
          readTime: 6
        }
      ]
    },
    'for-clients': {
      id: 'for-clients',
      title: 'For Clients',
      icon: FileText,
      articles: [
        {
          id: 'post-project',
          title: 'How to post a project',
          content: `Posting an effective project attracts quality service providers.

**Project Title**
Write a clear, specific title that summarizes what you need:
- Good: "React Developer for E-commerce Website"
- Avoid: "Need Help with Website"

**Project Description**
Include these key elements:
- What you're building or need done
- Specific requirements and features
- Target audience or use case
- Technical specifications
- Any existing work or starting point

**Budget and Timeline**
- Set a realistic budget range
- Consider the complexity of work
- Factor in testing and revision time
- Be clear about payment terms

**Skills and Categories**
- Select relevant skills required
- Choose the appropriate category
- Add technology-specific tags

**Attachments**
- Include wireframes or mockups
- Add technical documentation
- Provide brand guidelines
- Share reference materials

**Review Before Publishing**
Double-check all details and ensure everything is clear and complete.`,
          tags: ['projects', 'posting', 'requirements'],
          readTime: 8
        },
        {
          id: 'review-bids',
          title: 'Reviewing and accepting bids',
          content: `Choosing the right service provider is crucial for project success.

**Evaluating Bids**
Look for:
- Relevant experience and portfolio
- Clear understanding of your requirements
- Realistic timeline and budget
- Good communication skills
- Positive reviews and ratings

**Red Flags to Avoid**
- Extremely low bids that seem unrealistic
- Generic proposals that don't address your needs
- Poor grammar or communication
- No portfolio or examples
- Requests for upfront payment

**Asking Questions**
Before accepting, consider asking:
- Can you walk me through your approach?
- What's your experience with similar projects?
- How do you handle revisions?
- What's included in your bid?
- What's your communication schedule?

**Making Your Decision**
- Don't always choose the lowest bid
- Consider value, not just price
- Trust your instincts about communication
- Check references if provided

**Accepting a Bid**
Once you accept, the project officially begins and payment milestones are established.`,
          tags: ['bids', 'selection', 'evaluation'],
          readTime: 7
        },
        {
          id: 'manage-projects',
          title: 'Managing your projects',
          content: `Effective project management ensures successful outcomes.

**Project Dashboard**
Monitor:
- Current project status
- Milestone progress
- Communication history
- File sharing
- Time tracking

**Communication**
Best practices:
- Respond promptly to messages
- Be clear and specific in feedback
- Schedule regular check-ins
- Document important decisions
- Use the built-in messaging system

**Milestone Management**
- Review deliverables thoroughly
- Provide constructive feedback
- Approve milestones promptly when satisfied
- Request revisions if needed
- Keep the project moving forward

**File Management**
- Organize files in project folders
- Use version control for documents
- Share resources in a timely manner
- Backup important files

**Issue Resolution**
If problems arise:
- Communicate directly with the provider
- Document any issues
- Use the dispute resolution system if needed
- Contact support for assistance`,
          tags: ['management', 'communication', 'milestones'],
          readTime: 6
        },
        {
          id: 'payment-invoicing',
          title: 'Payment and invoicing',
          content: `Understanding the payment system protects both parties.

**Payment Structure**
- Milestone-based payments
- Escrow protection for funds
- Automatic release upon approval
- Dispute resolution process

**Setting Up Payments**
- Add payment methods to your account
- Verify billing information
- Set up automatic payments (optional)
- Configure payment notifications

**Milestone Payments**
- Funds are held in escrow
- Released when you approve deliverables
- Providers can't access funds until approval
- Automatic release after 7 days if no response

**Invoicing**
- Automatic invoice generation
- Detailed breakdown of work completed
- Payment history and receipts
- Tax documentation (if applicable)

**Dispute Resolution**
- Built-in mediation system
- Clear documentation process
- Platform protection policies
- Support team assistance

**Payment Security**
- SSL encryption for all transactions
- PCI compliance
- Fraud protection
- Secure payment processing`,
          tags: ['payment', 'invoicing', 'escrow'],
          readTime: 9
        }
      ]
    },
    'for-providers': {
      id: 'for-providers',
      title: 'For Service Providers',
      icon: MessageCircle,
      articles: [
        {
          id: 'submit-bid',
          title: 'How to submit a bid',
          content: `Crafting compelling bids increases your chances of winning projects.

**Research the Client**
- Read the project description carefully
- Check the client's profile and history
- Understand their industry or business
- Note their budget and timeline expectations

**Proposal Structure**
1. **Opening**: Address the client by name and reference their project
2. **Understanding**: Show you understand their needs
3. **Approach**: Explain your methodology
4. **Experience**: Highlight relevant skills and past work
5. **Timeline**: Provide a realistic schedule
6. **Price**: Justify your bid amount
7. **Next Steps**: Suggest how to proceed

**Writing Tips**
- Be professional but personable
- Use bullet points for clarity
- Include specific examples
- Proofread for grammar and spelling
- Keep it concise but comprehensive

**Standing Out**
- Reference specific project requirements
- Share relevant portfolio pieces
- Ask thoughtful questions
- Offer additional value
- Show enthusiasm for the project

**Common Mistakes**
- Generic, copy-paste proposals
- Unrealistic budgets or timelines
- Poor grammar or spelling
- Not reading requirements fully
- Being too pushy or aggressive`,
          tags: ['bidding', 'proposals', 'winning work'],
          readTime: 10
        },
        {
          id: 'create-services',
          title: 'Creating service listings',
          content: `Service listings help clients find you for specific offerings.

**Service Title**
- Be specific about what you offer
- Include key technologies or skills
- Use client-friendly language
- Make it searchable

**Service Description**
Include:
- What's included in your service
- Your process or methodology
- Typical timeline
- What clients can expect
- Prerequisites or requirements

**Pricing Structure**
Options:
- Fixed price packages
- Hourly rates
- Tiered pricing (basic/standard/premium)
- Custom quotes for complex work

**Portfolio Examples**
- Show your best work
- Include before/after examples
- Explain your role in each project
- Update regularly with new work

**Service Categories**
- Choose the most relevant category
- Add appropriate tags
- Select skill keywords
- Consider multiple categories if relevant

**Optimizing for Search**
- Use keywords clients search for
- Include technology names
- Mention industry-specific terms
- Keep descriptions current and relevant`,
          tags: ['services', 'listings', 'marketplace'],
          readTime: 8
        },
        {
          id: 'build-portfolio',
          title: 'Building your portfolio',
          content: `A strong portfolio showcases your skills and attracts better clients.

**Portfolio Basics**
- Include 5-10 of your best projects
- Show variety in your work
- Include different project types
- Keep it updated regularly

**Project Presentations**
For each project, include:
- Clear, high-quality images or demos
- Brief description of the challenge
- Your solution and approach
- Technologies or tools used
- Results or outcomes achieved
- Your specific role and contributions

**Case Studies**
Create detailed case studies for your best work:
- Client background and requirements
- Challenges faced during the project
- Your problem-solving process
- Technical implementation details
- Measurable results and impact
- Client testimonials if available

**Technical Examples**
- Code snippets (if applicable)
- Architecture diagrams
- Design mockups or prototypes
- Performance improvements
- Before/after comparisons

**Organization**
- Group similar projects together
- Use clear, descriptive titles
- Add filters by technology or industry
- Include project timelines
- Show progression of your skills

**Legal Considerations**
- Get client permission before sharing
- Remove sensitive information
- Use placeholder data when necessary
- Respect NDAs and confidentiality`,
          tags: ['portfolio', 'showcase', 'projects'],
          readTime: 12
        },
        {
          id: 'get-more-projects',
          title: 'Getting more projects',
          content: `Strategies to increase your project opportunities and success rate.

**Profile Optimization**
- Complete all profile sections
- Use professional photos
- Write compelling descriptions
- Showcase your best work
- Keep skills updated

**Bidding Strategy**
- Bid on projects that match your skills
- Respond quickly to new projects
- Customize each proposal
- Ask clarifying questions
- Follow up appropriately

**Building Reputation**
- Deliver quality work consistently
- Meet all deadlines
- Communicate professionally
- Go above and beyond when possible
- Ask satisfied clients for reviews

**Networking**
- Engage with clients professionally
- Build long-term relationships
- Seek repeat business
- Ask for referrals
- Participate in platform community

**Continuous Improvement**
- Learn new skills regularly
- Stay updated with industry trends
- Seek feedback from clients
- Analyze your successful proposals
- Adapt your approach based on results

**Marketing Your Services**
- Create compelling service listings
- Use relevant keywords
- Offer competitive pricing
- Provide clear deliverables
- Highlight your unique value proposition`,
          tags: ['success', 'strategy', 'growth'],
          readTime: 11
        }
      ]
    },
    'account': {
      id: 'account',
      title: 'Account & Billing',
      icon: HelpCircle,
      articles: [
        {
          id: 'manage-account',
          title: 'Managing your account',
          content: `Keep your account secure and up-to-date.

**Account Settings**
- Update personal information
- Change email address
- Modify username (if allowed)
- Set timezone preferences
- Configure language settings

**Security Settings**
- Change password regularly
- Enable two-factor authentication
- Review login activity
- Manage connected devices
- Set up security questions

**Privacy Controls**
- Control profile visibility
- Manage data sharing preferences
- Configure search appearance
- Set communication preferences
- Review privacy policy updates

**Account Verification**
- Verify email address
- Complete identity verification
- Verify payment methods
- Add emergency contact information
- Link social media accounts (optional)

**Data Management**
- Download your data
- Delete old projects or messages
- Manage file storage
- Backup important information
- Understand data retention policies

**Account Deletion**
If you need to close your account:
- Complete all ongoing projects
- Withdraw any remaining funds
- Download important data
- Contact support for assistance`,
          tags: ['account', 'settings', 'security'],
          readTime: 7
        },
        {
          id: 'change-password',
          title: 'Changing your password',
          content: `Keep your account secure with a strong password.

**Accessing Password Settings**
1. Go to your account settings
2. Click on "Security" tab
3. Select "Change Password"
4. Enter your current password
5. Create a new strong password

**Password Requirements**
- Minimum 8 characters
- Include uppercase and lowercase letters
- Add numbers and special characters
- Avoid common words or phrases
- Don't reuse recent passwords

**Creating Strong Passwords**
- Use a unique password for this account
- Consider using a password manager
- Include a mix of character types
- Make it memorable but not obvious
- Update it regularly

**Two-Factor Authentication**
For additional security:
- Enable 2FA in security settings
- Choose SMS or authenticator app
- Save backup codes safely
- Test the setup before relying on it

**If You Forgot Your Password**
- Use the "Forgot Password" link
- Check your email for reset instructions
- Follow the secure reset process
- Choose a new strong password
- Consider enabling 2FA

**Security Best Practices**
- Never share your password
- Log out of public computers
- Use secure networks
- Monitor account activity
- Report suspicious activity immediately`,
          tags: ['password', 'security', '2fa'],
          readTime: 5
        },
        {
          id: 'notification-settings',
          title: 'Notification settings',
          content: `Customize how and when you receive notifications.

**Email Notifications**
Control emails for:
- New project matches
- Bid updates and responses
- Message notifications
- Payment confirmations
- System announcements

**Push Notifications**
Manage mobile notifications for:
- Urgent messages
- Project deadlines
- Payment alerts
- Bid updates
- System maintenance

**In-App Notifications**
Configure dashboard alerts for:
- Real-time messages
- Project updates
- System notifications
- Achievement badges
- Platform updates

**Frequency Settings**
- Immediate notifications
- Daily digest emails
- Weekly summaries
- Monthly reports
- Custom schedules

**Notification Categories**

**For Clients:**
- New bids received
- Milestone deliveries
- Project completion
- Payment confirmations
- Provider communications

**For Service Providers:**
- New project opportunities
- Bid acceptance/rejection
- Client messages
- Payment notifications
- Platform updates

**Managing Preferences**
- Access through account settings
- Choose notification types
- Set delivery preferences
- Test notification delivery
- Update preferences as needed`,
          tags: ['notifications', 'preferences', 'alerts'],
          readTime: 6
        },
        {
          id: 'billing-subscriptions',
          title: 'Billing and subscriptions',
          content: `Understand platform fees, billing, and subscription options.

**Platform Fees**
- Service fee on completed projects
- Payment processing fees
- Currency conversion charges (if applicable)
- Premium feature costs
- Subscription tier differences

**Billing Cycle**
- Monthly billing for subscriptions
- Project-based fees
- Automatic payment processing
- Invoice generation and delivery
- Payment failure handling

**Payment Methods**
- Credit and debit cards
- Bank transfers
- Digital wallets
- Cryptocurrency (if available)
- Regional payment options

**Subscription Tiers**

**Free Tier:**
- Basic project posting
- Limited monthly bids
- Standard support
- Basic analytics

**Premium Tier:**
- Unlimited projects
- Advanced analytics
- Priority support
- Enhanced visibility
- Additional features

**Managing Billing**
- View billing history
- Download invoices
- Update payment methods
- Set up automatic payments
- Manage subscription changes

**Billing Support**
- Contact billing support
- Dispute resolution process
- Refund policies
- Tax documentation
- International billing assistance`,
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
      
      toast.success('Support request submitted successfully! We\'ll get back to you within 24 hours.');
      setContactForm({ email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Failed to send support email:', error);
      toast.error('Failed to send support request. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setContactForm(prev => ({ ...prev, [field]: e.target.value }));
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

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-12">
            <Button
              variant="ghost"
              onClick={() => setSearchQuery('')}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Clear search
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Search Results ({filteredArticles.length})</CardTitle>
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
                              in {article.categoryTitle}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {article.readTime} min read
                              </div>
                              <div className="flex gap-1">
                                {article.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="bg-muted px-2 py-1 rounded">
                                    {tag}
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
                    <p className="text-muted-foreground">No articles found for "{searchQuery}"</p>
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
                      {selectedArticle.readTime} min read
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      Tender Pilot Team
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedArticle.tags.map(tag => (
                      <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {tag}
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
                          {category.articles.length} articles
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
                  Back to categories
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
                                  {article.readTime} min read
                                </div>
                                <div className="flex gap-1">
                                  {article.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="bg-muted px-2 py-1 rounded">
                                      {tag}
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
              Still Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <form onSubmit={handleContactSupport} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="support-email">Your Email</Label>
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
                  <Label htmlFor="support-subject">Subject</Label>
                  <Input 
                    id="support-subject" 
                    placeholder="What do you need help with?"
                    value={contactForm.subject}
                    onChange={handleInputChange('subject')}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-message">Message</Label>
                <textarea
                  id="support-message"
                  className="w-full min-h-[120px] px-3 py-2 rounded-md border border-input bg-background"
                  placeholder="Describe your issue in detail..."
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
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
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
