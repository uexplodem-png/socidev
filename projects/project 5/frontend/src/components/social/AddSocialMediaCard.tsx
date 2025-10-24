import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Instagram, Youtube, Lock, Shield, Zap, AlertCircle } from 'lucide-react';

interface AccountForm {
  platform: 'instagram' | 'youtube' | '';
  email: string;
  password: string;
}

export const AddSocialMediaCard = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'youtube' | ''>('');
  const [formData, setFormData] = useState<AccountForm>({
    platform: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.platform) {
      setError('Please select a platform');
      return;
    }

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Here you would handle the account connection
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-50 to-white">
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <div className="absolute -inset-4">
            <div className="w-full h-full mx-auto rotate-6 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 blur-lg" />
          </div>
          <div className="relative bg-white w-16 h-16 rounded-xl flex items-center justify-center mx-auto ring-1 ring-gray-200/50">
            <div className="flex -space-x-2">
              <Instagram className="w-6 h-6 text-pink-500" />
              <Youtube className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mt-4">Add Your Account</h3>
        <p className="text-gray-500 mt-2">Enter your account credentials to connect</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Platform Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              setSelectedPlatform('instagram');
              setFormData(prev => ({ ...prev, platform: 'instagram' }));
            }}
            className={`group relative p-4 rounded-xl border-2 transition-all bg-white ${selectedPlatform === 'instagram'
                ? 'border-pink-500 bg-pink-50'
                : 'border-gray-200 hover:border-pink-200'
              }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
            <Instagram className={`w-8 h-8 mb-3 ${selectedPlatform === 'instagram' ? 'text-pink-500' : 'text-gray-400 group-hover:text-pink-400'
              }`} />
            <h4 className={`font-medium ${selectedPlatform === 'instagram' ? 'text-pink-500' : 'text-gray-900'
              }`}>Instagram</h4>
            <p className="text-sm text-gray-500 mt-1">Add Instagram account</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedPlatform('youtube');
              setFormData(prev => ({ ...prev, platform: 'youtube' }));
            }}
            className={`group relative p-4 rounded-xl border-2 transition-all bg-white ${selectedPlatform === 'youtube'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-200'
              }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
            <Youtube className={`w-8 h-8 mb-3 ${selectedPlatform === 'youtube' ? 'text-red-500' : 'text-gray-400 group-hover:text-red-400'
              }`} />
            <h4 className={`font-medium ${selectedPlatform === 'youtube' ? 'text-red-500' : 'text-gray-900'
              }`}>YouTube</h4>
            <p className="text-sm text-gray-500 mt-1">Add YouTube channel</p>
          </button>
        </div>

        {selectedPlatform && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder={`Enter your ${selectedPlatform} email`}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder={`Enter your ${selectedPlatform} password`}
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className={`w-full ${selectedPlatform === 'instagram'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
                  : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
                } text-white`}
            >
              Connect Account
            </Button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Secure</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Zap className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-gray-600">Fast</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Lock className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Private</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 text-center">
          Your credentials are securely encrypted and never stored in plain text.
          We use them only to connect to your account.
        </p>
      </form>
    </Card>
  );
};