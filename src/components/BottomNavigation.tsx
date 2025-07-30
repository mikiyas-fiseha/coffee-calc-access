import React from 'react';
import { Calculator, Image, Info, Settings, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMenuClick: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange, onMenuClick }) => {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const tabs = [
    { id: 'calculator', label: t.calculator, icon: Calculator },
    { id: 'display', label: t.display, icon: Image },
    { id: 'info', label: t.info, icon: Info },
  ];

  // Add admin tab only for admin/super_admin users
  if (profile?.role === 'admin' || profile?.role === 'super_admin') {
    tabs.push({ id: 'admin', label: t.admin, icon: Settings });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
        
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center p-3 rounded-lg transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <Menu className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">{t.menu}</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;