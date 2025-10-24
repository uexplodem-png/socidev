import React from 'react';

export default function TestPage() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Design Test</h1>
                <p className="text-gray-600 mb-6">If you can see proper styling, Tailwind is working correctly.</p>
                <div className="flex space-x-4">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                        Primary Button
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded">
                        Secondary Button
                    </button>
                </div>
            </div>
        </div>
    );
}