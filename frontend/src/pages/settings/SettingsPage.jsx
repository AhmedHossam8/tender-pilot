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
  const [bio, setBio] = useState('');
  
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
    if (profileData) {
      setBio(profileData.bio || '');
    }
  }, [user, profileData]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      // Update basic user info
      if (data.full_name || data.email) {
        await userService.updateUserInfo({
          full_name: data.full_name,
          email: data.email,
        });
      }
      // Update profile
      if (data.bio !== undefined) {
        await userService.updateProfile({ bio: data.bio });
      }
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
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
      toast.success('Password changed successfully!');
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
      bio: bio,
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
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
    toast.success('Notification preferences saved');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ];

  const switchLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    toast.success(`Language changed to ${newLang === 'en' ? 'English' : 'العربية'}`);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t('sidebar.settings', 'Settings')}</h1>

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
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about your projects and bids via email
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={(value) => handleNotificationChange('email', value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get instant notifications for important updates
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
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input 
                      id="current-password" 
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  {newPassword && newPassword !== confirmPassword && (
                    <p className="text-sm text-destructive">Passwords do not match</p>
                  )}
                  <Button 
                    onClick={handleChangePassword}
                    disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  >
                    {changePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'preferences' && (
              <Card>
                <CardHeader>
                  <CardTitle>General Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Language</Label>
                      <p className="text-sm text-muted-foreground">
                        Current: {i18n.language === 'en' ? 'English' : 'العربية'}
                      </p>
                    </div>
                    <Button variant="outline" onClick={switchLanguage}>
                      Switch Language
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
