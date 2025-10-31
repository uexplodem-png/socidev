import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useLanguage } from '../../context/LanguageContext';
import { AlertCircle } from 'lucide-react';
import { orderApi } from '../../lib/api/order';
import { toast } from 'react-hot-toast';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const reportSubjects = [
  {
    id: 'order-not-delivered',
    key: 'orderNotDelivered',
  },
  {
    id: 'wrong-quantity',
    key: 'wrongQuantity',
  },
  {
    id: 'quality-issues',
    key: 'qualityIssues',
  },
  {
    id: 'technical-problem',
    key: 'technicalProblem',
  },
  {
    id: 'billing-issue',
    key: 'billingIssue',
  },
  {
    id: 'other',
    key: 'other',
  }
];

export const ReportModal = ({ isOpen, onClose, orderId }: ReportModalProps) => {
  const { t } = useLanguage();
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // **PART 8: Submit report to backend**
  const handleSubmit = async () => {
    if (!selectedSubject) {
      setError(t('selectSubject'));
      return;
    }

    if (!description.trim()) {
      setError(t('provideDetails'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error(t('notAuthenticated'));
        return;
      }

      await orderApi.reportIssue(token, orderId, {
        type: selectedSubject,
        description: description.trim()
      });

      toast.success(t('reportSubmittedSuccessfully') || 'Report submitted successfully');
      
      // Reset form and close modal
      setSelectedSubject('');
      setDescription('');
      setError('');
      onClose();
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      setError(err.message || t('reportSubmissionFailed') || 'Failed to submit report');
      toast.error(t('reportSubmissionFailed') || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t('reportIssue')} - ${orderId}`}
    >
      <div className="space-y-6">
        {/* Subject Selection */}
        <div className="grid grid-cols-2 gap-4">
          {reportSubjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              className={`p-4 text-left rounded-xl border-2 transition-all ${selectedSubject === subject.id
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-red-200'
                }`}
            >
              <h4 className="font-medium text-gray-900">{t(subject.key)}</h4>
            </button>
          ))}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('reportDescription')}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('provideDetails')}
            rows={4}
            className="w-full rounded-lg border border-gray-300 focus:border-red-500 focus:ring-red-200 resize-none"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white disabled:opacity-50"
          >
            {isSubmitting ? t('submitting') || 'Submitting...' : t('submitReport')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};