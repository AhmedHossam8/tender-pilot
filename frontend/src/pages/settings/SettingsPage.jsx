import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/contexts/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { toast } from 'sonner';
import { User, Bell, Lock, Globe, Loader2 } from 'lucide-react';
import userService from '@/services/user.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification preferences (stored in localStorage)
  const [emailNotifications, setEmailNotifications] = useState(
    localStorage.getItem('emailNotifications') !== 'false'
  );
  const [pushNotifications, setPushNotifications] = useState(
    localStorage.getItem('pushNotifications') === 'true'
  );

  // Fetch user profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const response = await userService.getMyProfile();
      return response.data;
    },
  });

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      // Update basic user info
      await userService.updateUserInfo({
        full_name: data.full_name,
        email: data.email,
      });
    },
    onSuccess: () => {
      toast.success(t('notifications.profileUpdated'));
      queryClient.invalidateQueries(['my-profile']);
      queryClient.invalidateQueries(['current-user']);
      // Update auth store
      if (fullName || email) {
        updateUser({ full_name: fullName, email });
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || 'Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async ({ current, newPass }) => {
      return userService.changePassword(current, newPass);
    },
    onSuccess: () => {
      toast.success(t('notifications.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || 'Failed to change password');
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      full_name: fullName,
      email: email,
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      toast.error(t('settings.passwordChangeError'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t('settings.weakPassword'));
      return;
    }

    changePasswordMutation.mutate({
      current: currentPassword,
      newPass: newPassword,
    });
  };

  const handleNotificationChange = (type, value) => {
    if (type === 'email') {
      setEmailNotifications(value);
      localStorage.setItem('emailNotifications', value);
    } else if (type === 'push') {
      setPushNotifications(value);
      localStorage.setItem('pushNotifications', value);
    }
    toast.success(t('settings.saved'));
  };

  const tabs = [
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'security', label: t('settings.security'), icon: Lock },
    { id: 'preferences', label: t('settings.language'), icon: Globe },
  ];

  const switchLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    toast.success(t('notifications.settingsSaved'));
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t('settings.title')}</h1>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="md:col-span-3 space-y-6">
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.personalInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('settings.fullName')}</Label>
                    <Input 
                      id="name" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('settings.fullName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('settings.email')}</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('settings.email')}
                    />
                  </div>
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('settings.saving')}
                      </>
                    ) : (
                      t('settings.saveChanges')
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.notifications')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('settings.emailNotifications')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.projectUpdates')}
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={(value) => handleNotificationChange('email', value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('settings.pushNotifications')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.instant')}
                      </p>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={(value) => handleNotificationChange('push', value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Note: Notification preferences are saved locally in your browser
                  </p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.security')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">{t('settings.currentPassword')}</Label>
                    <Input 
                      id="current-password" 
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t('settings.currentPassword')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{t('settings.newPassword')}</Label>
                    <Input 
                      id="new-password" 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('settings.newPassword')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t('settings.confirmNewPassword')}</Label>
                    <Input 
                      id="confirm-password" 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('settings.confirmNewPassword')}
                    />
                  </div>
                  {newPassword && newPassword !== confirmPassword && (
                    <p className="text-sm text-destructive">{t('settings.passwordMismatch')}</p>
                  )}
                  <Button 
                    onClick={handleChangePassword}
                    disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  >
                    {changePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('settings.saving')}
                      </>
                    ) : (
                      t('settings.changePassword')
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'preferences' && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.languagePreference')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('settings.language')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {i18n.language === 'en' ? t('settings.english') : t('settings.arabic')}
                      </p>
                    </div>
                    <Button variant="outline" onClick={switchLanguage}>
                      {t('settings.language')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
