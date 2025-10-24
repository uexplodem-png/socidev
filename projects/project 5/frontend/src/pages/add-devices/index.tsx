import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import {
  Download,
  Monitor,
  Smartphone,
  Laptop,
  QrCode,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

interface DeviceFormData {
  name: string;
  type: 'PC' | 'Laptop' | 'Mobile';
  notes: string;
}

export const AddDevicesPage = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    type: 'PC',
    notes: '',
  });
  const [deviceId] = useState(`DEV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
  const [isConnected, setIsConnected] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle device registration
    setIsConnected(true);
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('addNewDevice')}</h1>
        <p className="mt-2 text-gray-600">{t('followStepsToAdd')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Setup Instructions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('setupInstructions')}</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{t('downloadProgram')}</h3>
                  <p className="text-gray-600 mb-4">{t('selectOperatingSystem')}:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => { }}
                    >
                      <Download className="w-4 h-4" />
                      Windows
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => { }}
                    >
                      <Download className="w-4 h-4" />
                      macOS
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => { }}
                    >
                      <Download className="w-4 h-4" />
                      Linux
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{t('installProgram')}</h3>
                  <p className="text-gray-600">{t('followInstallInstructions')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{t('loginToAccount')}</h3>
                  <p className="text-gray-600">{t('openAndLogin')}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-semibold">4</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{t('linkDevice')}</h3>
                  <p className="text-gray-600">{t('enterDeviceIdOrScan')}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Registration Form */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('deviceRegistration')}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('deviceName')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  maxLength={50}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  placeholder={t('enterDeviceName')}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('deviceType')}
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'PC', icon: Monitor },
                    { id: 'Laptop', icon: Laptop },
                    { id: 'Mobile', icon: Smartphone },
                  ].map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type: id as DeviceFormData['type'] }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${formData.type === id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-200'
                        }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${formData.type === id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                      <p className={`text-sm font-medium text-center ${formData.type === id ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                        {t(id.toLowerCase())}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  maxLength={200}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  placeholder={t('additionalNotes')}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {t('registerDevice')}
              </Button>
            </form>
          </Card>
        </div>

        {/* Device Info & QR Code */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('deviceInformation')}</h2>

            <div className="space-y-6">
              {/* Device ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('deviceId')}
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm font-mono text-gray-900">{deviceId}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(deviceId)}
                    className="ml-auto"
                  >
                    {t('copy')}
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200 inline-block mb-4">
                  <QrCode className="w-32 h-32 text-gray-900" />
                </div>
                <p className="text-sm text-gray-600">
                  {t('scanQrCode')}
                </p>
              </div>

              {/* Connection Status */}
              <div className={`p-4 rounded-lg flex items-center gap-3 ${isConnected ? 'bg-green-50' : 'bg-yellow-50'
                }`}>
                {isConnected ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{t('connected')}</p>
                      <p className="text-sm text-green-600">{t('deviceReady')}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-900">{t('waitingForConnection')}</p>
                      <p className="text-sm text-yellow-600">{t('completeSetup')}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Help Text */}
              <div className="flex items-start gap-2 text-sm text-gray-500">
                <Info className="w-4 h-4 mt-0.5" />
                <p>{t('needHelp')}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};