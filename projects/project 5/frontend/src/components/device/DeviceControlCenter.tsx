import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import {
  Power,
  Pause,
  Play,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload,
  Cpu,
  Activity,
} from 'lucide-react';

interface DeviceControlCenterProps {
  onlineDevices: number;
  busyDevices: number;
  offlineDevices: number;
  averageCpu: number;
  averageMemory: number;
  averageNetwork: number;
  onBulkStart: () => void;
  onBulkStop: () => void;
  onBulkRestart: () => void;
  isLoading?: boolean;
}

export const DeviceControlCenter = ({
  onlineDevices,
  busyDevices,
  offlineDevices,
  averageCpu,
  averageMemory,
  averageNetwork,
  onBulkStart,
  onBulkStop,
  onBulkRestart,
  isLoading = false,
}: DeviceControlCenterProps) => {
  const { t } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'start' | 'stop' | 'restart' | null>(null);

  const handleAction = (action: 'start' | 'stop' | 'restart') => {
    setConfirmAction(action);
    setShowConfirm(true);
  };

  const executeAction = () => {
    switch (confirmAction) {
      case 'start':
        onBulkStart();
        break;
      case 'stop':
        onBulkStop();
        break;
      case 'restart':
        onBulkRestart();
        break;
    }
    setShowConfirm(false);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('deviceControlCenter')}</h2>
            <p className="text-sm text-gray-500">{t('manageDevices')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">{t('systemActive')}</span>
          </div>
        </div>

        {/* Device Status Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">{t('online')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{onlineDevices}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-900">{t('busy')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{busyDevices}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-900">{t('offline')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{offlineDevices}</p>
          </div>
        </div>

        {/* System Performance */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">{t('systemPerformance')}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">{t('averageCpuUsage')}</span>
                <span className="font-medium text-gray-900">{averageCpu}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${averageCpu}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">{t('averageMemoryUsage')}</span>
                <span className="font-medium text-gray-900">{averageMemory}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${averageMemory}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">{t('averageNetworkUsage')}</span>
                <span className="font-medium text-gray-900">{averageNetwork}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${averageNetwork}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Network Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">{t('download')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">2.5 MB/s</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">{t('upload')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">1.8 MB/s</p>
          </div>
        </div>

        {/* Bulk Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">{t('bulkActions')}</h3>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleAction('start')}
              disabled={isLoading}
              className="flex-1"
            >
              <Power className="w-4 h-4 mr-2" />
              {t('startAll')}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('stop')}
              disabled={isLoading}
              className="flex-1"
            >
              <Pause className="w-4 h-4 mr-2" />
              {t('stopAll')}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAction('restart')}
              disabled={isLoading}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('restartAll')}
            </Button>
          </div>
        </div>

        {/* System Status */}
        <div className="flex items-start gap-2 bg-blue-50 p-4 rounded-lg">
          <Cpu className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">{t('systemStatus')}</p>
            <p className="text-sm text-blue-600">
              {t('allSystemsOperating')}. {t('lastCheck')}: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('confirmAction')}</h3>
            <div className="flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-gray-600">
                  {confirmAction === 'start'
                    ? t('confirmStartAll')
                    : confirmAction === 'stop'
                    ? t('confirmStopAll')
                    : t('confirmRestartAll')}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={executeAction}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t('confirm')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};