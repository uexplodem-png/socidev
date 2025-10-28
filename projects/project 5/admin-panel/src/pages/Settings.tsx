import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Zap,
  Globe,
  Lock,
  Sliders,
} from 'lucide-react';
import FeatureFlagsTab from '../components/settings/FeatureFlagsTab';
import AccessControlTab from '../components/settings/AccessControlTab';
import GeneralTab from '../components/settings/GeneralTab';
import ModesTab from '../components/settings/ModesTab';
import SecurityTab from '../components/settings/SecurityTab';

type TabId = 'general' | 'flags' | 'access' | 'modes' | 'security';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const tabs: Tab[] = [
    {
      id: 'general',
      label: 'General',
      icon: <Globe className="h-5 w-5" />,
      component: <GeneralTab />,
    },
    {
      id: 'flags',
      label: 'Feature Flags',
      icon: <Zap className="h-5 w-5" />,
      component: <FeatureFlagsTab />,
    },
    {
      id: 'access',
      label: 'Access Control',
      icon: <Shield className="h-5 w-5" />,
      component: <AccessControlTab />,
    },
    {
      id: 'modes',
      label: 'Modes',
      icon: <Sliders className="h-5 w-5" />,
      component: <ModesTab />,
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Lock className="h-5 w-5" />,
      component: <SecurityTab />,
    },
  ];

  const activeTabComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <SettingsIcon className="h-7 w-7 mr-3 text-blue-600 dark:text-blue-500" />
            System Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure system-wide settings, feature flags, and access control
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <span className={`mr-2 ${isActive ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTabComponent}
        </div>
      </div>
    </div>
  );
};

export default Settings;
