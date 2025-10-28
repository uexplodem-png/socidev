// Example: How to integrate RBAC into Balance.tsx
// This is a reference example - not meant to replace the entire file

import React, { useState, useEffect } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { useSettingsStore } from '../store/settingsStore';
import ProtectedButton from '../components/common/ProtectedButton';
import ProtectedElement from '../components/common/ProtectedElement';

const Balance: React.FC = () => {
  // Add permission and settings hooks
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const { getFeatureFlag } = useSettingsStore();

  // Existing state...
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<BalanceEntry | null>(null);
  // ... other state

  // STEP 1: Page-level permission guard
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!hasPermission('transactions.view')) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
            Access Denied
          </h2>
          <p className="text-red-700 dark:text-red-300">
            You don't have permission to view transactions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Balance Management
          </h1>
        </div>

        <div className="flex space-x-3">
          {/* STEP 2: Protect the "Add Balance" button */}
          <ProtectedButton
            permission="transactions.create"
            featureFlag="features.transactions.createEnabled"
            onClick={() => setShowAddBalanceModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Balance Entry
          </ProtectedButton>

          {/* Regular refresh button (no permission needed) */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <tbody>
            {balanceEntries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.userName}</td>
                <td>${entry.amount}</td>
                <td>{entry.status}</td>
                <td>
                  {/* STEP 3: Protect action buttons with permissions + feature flags */}
                  {entry.status === 'pending' && (
                    <div className="flex space-x-2">
                      <ProtectedButton
                        permission="transactions.approve"
                        featureFlag="features.transactions.approveEnabled"
                        onClick={() => handleRequestAction(entry, 'approve')}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                      >
                        Approve
                      </ProtectedButton>

                      <ProtectedButton
                        permission="transactions.reject"
                        featureFlag="features.transactions.rejectEnabled"
                        onClick={() => handleRequestAction(entry, 'reject')}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Reject
                      </ProtectedButton>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* STEP 4: Protect admin-only sections */}
      <ProtectedElement permission="transactions.adjust">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            Admin Tools
          </h3>
          <button
            onClick={handleAdjustBalance}
            disabled={!getFeatureFlag('features.transactions.adjustEnabled')}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Adjust Balance
          </button>
        </div>
      </ProtectedElement>

      {/* Request Modal */}
      {showRequestModal && selectedRequest && (
        <Modal onClose={() => setShowRequestModal(false)}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">
              {requestAction === 'approve' ? 'Approve' : 'Reject'} Request
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  rows={3}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessRequest}
                  className={`px-4 py-2 rounded text-white ${
                    requestAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm {requestAction === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Balance;

/* 
INTEGRATION SUMMARY FOR BALANCE.TSX:

1. Import hooks:
   - usePermissions from '../hooks/usePermissions'
   - useSettingsStore from '../store/settingsStore'

2. Import components:
   - ProtectedButton from '../components/common/ProtectedButton'
   - ProtectedElement from '../components/common/ProtectedElement'

3. Add hooks to component:
   const { hasPermission, isLoading: permissionsLoading } = usePermissions();
   const { getFeatureFlag } = useSettingsStore();

4. Add page-level guard:
   if (!hasPermission('transactions.view')) return <AccessDenied />;

5. Replace action buttons with ProtectedButton:
   - Add Balance → permission="transactions.create", featureFlag="features.transactions.createEnabled"
   - Approve → permission="transactions.approve", featureFlag="features.transactions.approveEnabled"
   - Reject → permission="transactions.reject", featureFlag="features.transactions.rejectEnabled"
   - Adjust → permission="transactions.adjust", featureFlag="features.transactions.adjustEnabled"

6. Wrap admin sections with ProtectedElement:
   <ProtectedElement permission="transactions.adjust">
     <AdminControls />
   </ProtectedElement>

7. Test scenarios:
   - Login as moderator (should only see view, no action buttons)
   - Toggle feature flags off (buttons should disable)
   - Login as super_admin (should see everything)
   - Clear RBAC cache and verify changes apply immediately
*/
