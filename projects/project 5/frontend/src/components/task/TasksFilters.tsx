import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import {
  Search,
  Filter,
  RefreshCw,
  Instagram,
  Youtube
} from 'lucide-react';

interface TaskFiltersProps {
  filters: {
    platform?: string;
    type?: string;
    search?: string;
  };
  onFilterChange: (filters: any) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFilterChange,
  onRefresh,
  isRefreshing = false
}) => {
  const { t } = useLanguage();

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              placeholder={t('searchTasks')}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Platform Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filters.platform || ''}
              onChange={(e) => onFilterChange({ ...filters, platform: e.target.value })}
              className="pr-8 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-200"
            >
              <option value="">{t('allPlatforms')}</option>
              <option value="instagram">
                Instagram
              </option>
              <option value="youtube">
                YouTube
              </option>
            </select>
          </div>

          {/* Task Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filters.type || ''}
              onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
              className="pr-8 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-200"
            >
              <option value="">{t('allTypes')}</option>
              <option value="like">{t('likes')}</option>
              <option value="follow">{t('follows')}</option>
              <option value="view">{t('views')}</option>
              <option value="subscribe">{t('subscribes')}</option>
            </select>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>
      </div>
    </Card>
  );
};