import { LayoutDashboard, Layers, Users, Activity, Settings, Award, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProjectNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLeaderInGroup: boolean;
  isGroupCreator: boolean;
  membersCount: number;
}

interface NavTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showAlways?: boolean;
  description: string;
  color: string;
}

const tabs: NavTab[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard, showAlways: true, description: 'Xem tổng quan dự án', color: 'text-blue-500' },
  { id: 'tasks', label: 'Task & Giai đoạn', icon: Layers, showAlways: true, description: 'Quản lý công việc', color: 'text-emerald-500' },
  { id: 'resources', label: 'Tài nguyên', icon: FolderOpen, showAlways: true, description: 'File & tài liệu', color: 'text-amber-500' },
  { id: 'members', label: 'Thành viên', icon: Users, showAlways: true, description: 'Danh sách thành viên', color: 'text-violet-500' },
  { id: 'scores', label: 'Điểm quá trình', icon: Award, showAlways: true, description: 'Điểm số & đánh giá', color: 'text-rose-500' },
  { id: 'logs', label: 'Nhật ký', icon: Activity, showAlways: true, description: 'Lịch sử hoạt động', color: 'text-cyan-500' },
  { id: 'settings', label: 'Cài đặt', icon: Settings, showAlways: false, description: 'Cấu hình dự án', color: 'text-slate-500' },
];

export default function ProjectNavigation({
  activeTab,
  onTabChange,
  isLeaderInGroup,
  isGroupCreator,
  membersCount,
}: ProjectNavigationProps) {
  const visibleTabs = tabs.filter(tab => 
    tab.showAlways || (tab.id === 'settings' && isLeaderInGroup && isGroupCreator)
  );

  return (
    <div className="w-full bg-gradient-to-r from-muted/80 via-muted/50 to-muted/80 border-b border-border/50 sticky top-16 z-40 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-4">
        {/* Navigation tabs with horizontal scroll on mobile */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
          <TooltipProvider delayDuration={300}>
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <Tooltip key={tab.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onTabChange(tab.id)}
                      className={cn(
                        "relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                        "group shrink-0",
                        isActive 
                          ? "bg-background shadow-md border border-border/80 text-foreground" 
                          : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                      )}
                    >
                      <div className={cn(
                        "relative flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-primary/10" 
                          : "bg-transparent group-hover:bg-muted"
                      )}>
                        <Icon className={cn(
                          "w-4 h-4 shrink-0 transition-all duration-200",
                          isActive ? tab.color : "text-muted-foreground group-hover:text-foreground",
                          "group-hover:scale-110"
                        )} />
                      </div>
                      
                      <span className={cn(
                        "hidden sm:block transition-colors",
                        isActive && "font-semibold"
                      )}>
                        {tab.label}
                      </span>
                      
                      {/* Member count badge */}
                      {tab.id === 'members' && (
                        <span className={cn(
                          "px-1.5 py-0.5 text-xs font-medium rounded-full transition-colors",
                          isActive 
                            ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {membersCount}
                        </span>
                      )}
                      
                      {/* Active indicator - animated dot */}
                      {isActive && (
                        <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-foreground text-background">
                    <p className="font-medium">{tab.label}</p>
                    <p className="text-xs opacity-80">{tab.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>
      </div>
    </div>
  );
}