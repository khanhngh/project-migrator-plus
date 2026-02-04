import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Search,
  Filter,
  ChevronDown,
  RotateCcw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ListTodo,
  CalendarClock,
  User,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, Stage, GroupMember } from '@/types/database';

export interface TaskFilters {
  searchText: string;
  status: string;
  assignee: string;
  hasDeadline: string;
  isOverdue: string;
  hasSubmission: string;
}

interface TaskFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  members: GroupMember[];
  tasks: Task[];
  onReset: () => void;
}

// Quick filter definitions
interface QuickFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
  filter: Partial<TaskFilters>;
  color: string;
  count?: number;
}

export const defaultTaskFilters: TaskFilters = {
  searchText: '',
  status: 'all',
  assignee: 'all',
  hasDeadline: 'all',
  isOverdue: 'all',
  hasSubmission: 'all',
};

export default function TaskFilters({
  filters,
  onFiltersChange,
  members,
  tasks,
  onReset,
}: TaskFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate counts for quick filters
  const counts = useMemo(() => {
    const now = new Date();
    return {
      overdue: tasks.filter(t => {
        if (!t.deadline || t.status === 'DONE' || t.status === 'VERIFIED') return false;
        return new Date(t.deadline) < now;
      }).length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      todo: tasks.filter(t => t.status === 'TODO').length,
      noSubmission: tasks.filter(t => !t.submission_link && t.status !== 'VERIFIED').length,
      deadlineToday: tasks.filter(t => {
        if (!t.deadline) return false;
        const deadline = new Date(t.deadline);
        return deadline.toDateString() === now.toDateString();
      }).length,
      done: tasks.filter(t => t.status === 'DONE' || t.status === 'VERIFIED').length,
    };
  }, [tasks]);

  // Quick filters
  const quickFilters: QuickFilter[] = [
    {
      id: 'overdue',
      label: 'Trễ hạn',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      filter: { isOverdue: 'yes', status: 'all' },
      color: 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20',
      count: counts.overdue,
    },
    {
      id: 'inProgress',
      label: 'Đang làm',
      icon: <Loader2 className="w-3.5 h-3.5" />,
      filter: { status: 'IN_PROGRESS' },
      color: 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20',
      count: counts.inProgress,
    },
    {
      id: 'todo',
      label: 'Chờ xử lý',
      icon: <ListTodo className="w-3.5 h-3.5" />,
      filter: { status: 'TODO' },
      color: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
      count: counts.todo,
    },
    {
      id: 'noSubmission',
      label: 'Chưa nộp',
      icon: <Clock className="w-3.5 h-3.5" />,
      filter: { hasSubmission: 'no' },
      color: 'bg-orange-500/10 text-orange-600 border-orange-500/30 hover:bg-orange-500/20',
      count: counts.noSubmission,
    },
    {
      id: 'deadlineToday',
      label: 'Hôm nay',
      icon: <CalendarClock className="w-3.5 h-3.5" />,
      filter: { hasDeadline: 'today' },
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20',
      count: counts.deadlineToday,
    },
    {
      id: 'done',
      label: 'Hoàn thành',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      filter: { status: 'DONE_OR_VERIFIED' },
      color: 'bg-success/10 text-success border-success/30 hover:bg-success/20',
      count: counts.done,
    },
  ];

  // Check if a quick filter is active
  const isQuickFilterActive = (qf: QuickFilter) => {
    return Object.entries(qf.filter).every(([key, value]) => {
      return filters[key as keyof TaskFilters] === value;
    });
  };

  // Apply quick filter
  const applyQuickFilter = (qf: QuickFilter) => {
    if (isQuickFilterActive(qf)) {
      // Deactivate - reset to defaults
      onFiltersChange({ ...defaultTaskFilters, searchText: filters.searchText });
    } else {
      // Activate
      onFiltersChange({ ...defaultTaskFilters, searchText: filters.searchText, ...qf.filter });
    }
  };

  // Count active filters
  const activeFiltersCount = [
    filters.searchText,
    filters.status !== 'all' ? filters.status : '',
    filters.assignee !== 'all' ? filters.assignee : '',
    filters.hasDeadline !== 'all' ? filters.hasDeadline : '',
    filters.isOverdue !== 'all' ? filters.isOverdue : '',
    filters.hasSubmission !== 'all' ? filters.hasSubmission : '',
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Filter toggle + Reset */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm task..."
            value={filters.searchText}
            onChange={(e) => onFiltersChange({ ...filters, searchText: e.target.value })}
            className="pl-9 h-9"
          />
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-9">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Lọc nâng cao</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-9 px-2 gap-1">
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Row 2: Quick filters */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
          <Zap className="w-3 h-3" />
          Nhanh:
        </span>
        {quickFilters.map((qf) => (
          <Button
            key={qf.id}
            variant="outline"
            size="sm"
            className={cn(
              "h-7 text-xs px-2 gap-1 border transition-all",
              isQuickFilterActive(qf) ? qf.color : "hover:bg-accent"
            )}
            onClick={() => applyQuickFilter(qf)}
          >
            {qf.icon}
            {qf.label}
            {qf.count !== undefined && qf.count > 0 && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "h-4 px-1 text-[10px] ml-0.5",
                  isQuickFilterActive(qf) && "bg-background/50"
                )}
              >
                {qf.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Collapsible advanced filters */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="flex flex-wrap gap-2 pt-2 pb-1 border-t">
            {/* Status */}
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="TODO">Chờ xử lý</SelectItem>
                <SelectItem value="IN_PROGRESS">Đang làm</SelectItem>
                <SelectItem value="DONE">Hoàn thành</SelectItem>
                <SelectItem value="VERIFIED">Đã duyệt</SelectItem>
                <SelectItem value="DONE_OR_VERIFIED">Xong / Duyệt</SelectItem>
              </SelectContent>
            </Select>

            {/* Assignee */}
            <Select
              value={filters.assignee}
              onValueChange={(value) => onFiltersChange({ ...filters, assignee: value })}
            >
              <SelectTrigger className="w-[150px] h-8 text-sm">
                <User className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Người phụ trách" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Tất cả thành viên</SelectItem>
                <SelectItem value="unassigned">Chưa phân công</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.profiles?.full_name || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Deadline */}
            <Select
              value={filters.hasDeadline}
              onValueChange={(value) => onFiltersChange({ ...filters, hasDeadline: value })}
            >
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue placeholder="Deadline" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Tất cả deadline</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="thisWeek">Tuần này</SelectItem>
                <SelectItem value="yes">Có deadline</SelectItem>
                <SelectItem value="no">Không có deadline</SelectItem>
              </SelectContent>
            </Select>

            {/* Overdue */}
            <Select
              value={filters.isOverdue}
              onValueChange={(value) => onFiltersChange({ ...filters, isOverdue: value })}
            >
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue placeholder="Trễ hạn" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="yes">Đang trễ</SelectItem>
                <SelectItem value="no">Không trễ</SelectItem>
              </SelectContent>
            </Select>

            {/* Submission */}
            <Select
              value={filters.hasSubmission}
              onValueChange={(value) => onFiltersChange({ ...filters, hasSubmission: value })}
            >
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue placeholder="Nộp bài" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="yes">Đã nộp</SelectItem>
                <SelectItem value="no">Chưa nộp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
