import React from 'react';
import { X, User, Moon, Sun, Globe, LogOut, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import ForgotPasswordModal from './ForgotPasswordModal';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SlideOutMenu: React.FC<SlideOutMenuProps> = ({ isOpen, onClose }) => {
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const getSubscriptionDaysLeft = () => {
    if (!profile?.created_at) return 0;
    
    // For demo purposes, assume 30-day subscription from creation date
    const createdDate = new Date(profile.created_at);
    const expiryDate = new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    const today = new Date();
    const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, daysLeft);
  };

  const getSubscriptionStatus = () => {
    if (!profile?.is_paid) return t.noSubscription;
    
    const daysLeft = getSubscriptionDaysLeft();
    if (daysLeft > 0) return t.subscriptionActive;
    return t.subscriptionExpired;
  };

  const getStatusBadgeVariant = () => {
    if (!profile?.is_paid) return 'secondary';
    
    const daysLeft = getSubscriptionDaysLeft();
    if (daysLeft > 7) return 'default';
    if (daysLeft > 0) return 'destructive';
    return 'secondary';
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Slide out menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-card border-l border-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">{t.menu}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* User Profile */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{profile?.name || t.profile}</CardTitle>
                    <p className="text-sm text-muted-foreground truncate">
                      {profile?.mobile_number}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t.subscription}:</span>
                    <Badge variant={getStatusBadgeVariant()}>
                      {getSubscriptionStatus()}
                    </Badge>
                  </div>
                  
                  {profile?.is_paid && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t.daysLeft}:</span>
                      <span className="text-sm text-muted-foreground">
                        {getSubscriptionDaysLeft()} days
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Settings
              </h3>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {theme === 'dark' ? t.darkMode : t.lightMode}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={toggleTheme}>
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Language Selection */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">{t.language}</span>
                </div>
                <Select value={language} onValueChange={(value: 'en' | 'am') => setLanguage(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="am">አማርኛ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Forgot Password */}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowForgotPassword(true)}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                {t.resetPassword}
              </Button>
            </div>

            <Separator />

            {/* Sign Out */}
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t.signOut}
            </Button>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </>
  );
};

export default SlideOutMenu;