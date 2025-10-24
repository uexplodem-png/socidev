import React from "react";
import { Card } from "../ui/Card";
import { Search, Clock } from "lucide-react";

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
}

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedStatus = "all",
  onStatusChange,
}) => {
  return (
    <Card className='p-6 mb-6'>
      <div className='flex flex-col sm:flex-row gap-4'>
        {/* Search */}
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder='Search orders...'
              className='w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-200'
            />
          </div>
        </div>

        {/* Status Filter */}
        {onStatusChange && (
          <div className='flex items-center gap-2'>
            <Clock className='w-5 h-5 text-gray-400' />
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className='w-full pr-8 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-blue-200'>
              <option value='all'>All Statuses</option>
              <option value='completed'>Completed</option>
              <option value='processing'>Processing</option>
              <option value='pending'>Pending</option>
              <option value='failed'>Failed</option>
            </select>
          </div>
        )}
      </div>
    </Card>
  );
};
