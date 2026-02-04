import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Filter, X, CalendarIcon, Search, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface ActivityFilters {
  searchText: string;
  actionType: string;
  action: string;
  userId: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface ActivityLogFiltersProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
  users: { id: string; name: string }[];
  onReset: () => void;
}

const ACTION_TYPES = [
  { value: 'all', label: 'Tất cả loại' },
  { value: 'member', label: 'Thành viên' },
  { value: 'stage', label: 'Giai đoạn' },
  { value: 'task', label: 'Task' },
  { value: 'resource', label: 'Tài nguyên' },
];

const ACTIONS = [
  { value: 'all', label: 'Tất cả hành động' },
  { value: 'CREATE', label: 'Tạo mới' },
  { value: 'UPDATE', label: 'Cập nhật' },
  { value: 'DELETE', label: 'Xóa' },
  { value: 'ADD', label: 'Thêm' },
  { value: 'REMOVE', label: 'Loại bỏ' },
  { value: 'SUBMISSION', label: 'Nộp bài' },
];

export default function ActivityLogFilters({ 
  filters, 
  onFiltersChange, 
  users,
  onReset 
}: ActivityLogFiltersProps) {
  const activeFiltersCount = [
    filters.searchText,
    filters.actionType !== 'all' ? filters.actionType : '',
    filters.action !== 'all' ? filters.action : '',
    filters.userId !== 'all' ? filters.userId : '',
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm trong nhật ký..."
          value={filters.searchText}
          onChange={(e) => onFiltersChange({ ...filters, searchText: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2">
        {/* Action Type */}
        <Select
          value={filters.actionType}
          onValueChange={(value) => onFiltersChange({ ...filters, actionType: value })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action */}
        <Select
          value={filters.action}
          onValueChange={(value) => onFiltersChange({ ...filters, action: value })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Hành động" />
          </SelectTrigger>
          <SelectContent>
            {ACTIONS.map((action) => (
              <SelectItem key={action.value} value={action.value}>
                {action.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* User */}
        <Select
          value={filters.userId}
          onValueChange={(value) => onFiltersChange({ ...filters, userId: value })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Người thực hiện" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả người dùng</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !filters.dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom ? format(filters.dateFrom, 'dd/MM/yyyy') : 'Từ ngày'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateFrom}
              onSelect={(date) => onFiltersChange({ ...filters, dateFrom: date })}
              locale={vi}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !filters.dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateTo ? format(filters.dateTo, 'dd/MM/yyyy') : 'Đến ngày'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.dateTo}
              onSelect={(date) => onFiltersChange({ ...filters, dateTo: date })}
              locale={vi}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Reset button */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-1">
            <RotateCcw className="w-4 h-4" />
            Đặt lại
            <Badge variant="secondary" className="ml-1">{activeFiltersCount}</Badge>
          </Button>
        )}
      </div>
    </div>
  );
}
