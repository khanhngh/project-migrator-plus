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
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  showAlways?: boolean;
  description: string;
}

const tabs: NavTab[] = [
  { id: 'overview', label: 'Tổng quan', shortLabel: 'Tổng quan', icon: LayoutDashboard, showAlways: true, description: 'Xem tổng quan dự án' },
  { id: 'tasks', label: 'Task', shortLabel: 'Task', icon: Layers, showAlways: true, description: 'Quản lý công việc' },
  { id: 'resources', label: 'Tài nguyên', shortLabel: 'File', icon: FolderOpen, showAlways: true, description: 'File & tài liệu' },
  { id: 'members', label: 'Thành viên', shortLabel: 'Nhóm', icon: Users, showAlways: true, description: 'Danh sách thành viên' },
  { id: 'scores', label: 'Điểm', shortLabel: 'Điểm', icon: Award, showAlways: true, description: 'Điểm số & đánh giá' },
  { id: 'logs', label: 'Nhật ký', shortLabel: 'Log', icon: Activity, showAlways: true, description: 'Lịch sử hoạt động' },
  { id: 'settings', label: 'Cài đặt', shortLabel: 'Cài đặt', icon: Settings, showAlways: false, description: 'Cấu hình dự án' },
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
    <div className="w-full border-b border-border/40 sticky top-16 z-40 bg-background/95 backdrop-blur-sm">
      <div className="max-w-[1600px] mx-auto px-3">
        {/* Navigation tabs - centered */}
        <nav className="flex items-center justify-center py-1.5">
          <div className="inline-flex items-center bg-muted/60 rounded-lg p-0.5 gap-0.5">
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
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                          isActive 
                            ? "bg-background shadow-sm text-foreground" 
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                      >
                        <Icon className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          isActive && "text-primary"
                        )} />
                        
                        {/* Show short label on sm, full label on md+ */}
                        <span className="sm:hidden">{tab.shortLabel}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                        
                        {/* Member count badge - compact */}
                        {tab.id === 'members' && (
                          <span className={cn(
                            "px-1 py-px text-[10px] font-medium rounded",
                            isActive 
                              ? "bg-primary/15 text-primary" 
                              : "bg-muted-foreground/20 text-muted-foreground"
                          )}>
                            {membersCount}
                          </span>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={6}>
                      <p className="font-medium text-xs">{tab.label}</p>
                      <p className="text-[10px] text-muted-foreground">{tab.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </nav>
      </div>
    </div>
  );
}