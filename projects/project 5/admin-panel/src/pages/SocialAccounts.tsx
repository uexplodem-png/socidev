import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { usePermissions } from '../hooks/usePermissions';

const SocialAccounts: React.FC = () => {
    const { hasPermission } = usePermissions();

    return (
        <div className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Social Accounts</h1>
                {hasPermission('users.edit') && (
                    <Button>Connect Account</Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Connected Social Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                                    <div className="bg-blue-500 text-white p-2 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Twitter</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">@johndoe</p>
                                </div>
                            </div>
                            <div className="mt-4 flex space-x-2">
                                <Button variant="outline" size="sm">View</Button>
                                {hasPermission('users.edit') && (
                                    <Button variant="danger" size="sm">Disconnect</Button>
                                )}
                            </div>
                        </div>

                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full">
                                    <div className="bg-blue-600 text-white p-2 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                                        </svg>
                                    </div>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Facebook</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">John Doe</p>
                                </div>
                            </div>
                            <div className="mt-4 flex space-x-2">
                                <Button variant="outline" size="sm">View</Button>
                                {hasPermission('users.edit') && (
                                    <Button variant="danger" size="sm">Disconnect</Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default SocialAccounts;