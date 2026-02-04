import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Loader2, Users, ListTodo, Award, FolderOpen, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { exportProjectEvidencePdf, ExportData, ExportOptions } from '@/lib/projectEvidencePdf';
import type { Group, GroupMember, Task, Stage } from '@/types/database';

interface ProjectEvidenceExportProps {
  groupId: string;
  project: Group;
}

export default function ProjectEvidenceExport({ groupId, project }: ProjectEvidenceExportProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  const [options, setOptions] = useState<ExportOptions>({
    includeMembers: true,
    includeTasks: true,
    includeScores: true,
    includeResources: true,
    includeLogs: true,
  });

  const handleOptionChange = (key: keyof ExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = async () => {
    // Validate at least one option selected
    const hasSelection = Object.values(options).some(v => v);
    if (!hasSelection) {
      toast({
        title: 'Chưa chọn nội dung',
        description: 'Vui lòng chọn ít nhất một mục để xuất',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    setProgress(0);

    try {
      // Fetch all data in parallel
      setProgressMessage('Đang tải dữ liệu...');
      setProgress(10);

      const [
        { data: membersData },
        { data: stagesData },
        { data: tasksData },
      ] = await Promise.all([
        supabase.from('group_members').select('*').eq('group_id', groupId),
        supabase.from('stages').select('*').eq('group_id', groupId).order('order_index'),
        supabase.from('tasks').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
      ]);

      setProgress(30);

      // Fetch profiles for members
      let members: GroupMember[] = [];
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData } = await supabase.from('profiles').select('*').in('id', userIds);
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        members = membersData.map(m => ({ ...m, profiles: profilesMap.get(m.user_id) })) as GroupMember[];
      }

      setProgress(40);

      // Fetch task assignments
      let tasks: Task[] = [];
      if (tasksData && tasksData.length > 0) {
        const taskIds = tasksData.map(t => t.id);
        const { data: assignmentsData } = await supabase.from('task_assignments').select('*').in('task_id', taskIds);
        const assigneeIds = [...new Set(assignmentsData?.map(a => a.user_id) || [])];
        const { data: assigneeProfiles } = await supabase.from('profiles').select('*').in('id', assigneeIds.length > 0 ? assigneeIds : ['none']);
        const profilesMap = new Map(assigneeProfiles?.map(p => [p.id, p]) || []);
        tasks = tasksData.map(task => ({
          ...task,
          task_assignments: assignmentsData?.filter(a => a.task_id === task.id).map(a => ({ ...a, profiles: profilesMap.get(a.user_id) })) || [],
        })) as Task[];
      }

      setProgress(50);
      setProgressMessage('Đang tải điểm số...');

      // Fetch scores
      let taskScores: any[] = [];
      let stageScores: any[] = [];
      let finalScores: any[] = [];

      if (options.includeScores) {
        const taskIds = tasks.map(t => t.id);
        const stageIds = (stagesData || []).map(s => s.id);

        const [
          { data: taskScoresData },
          { data: stageScoresData },
          { data: finalScoresData },
        ] = await Promise.all([
          taskIds.length > 0 
            ? supabase.from('task_scores').select('*').in('task_id', taskIds)
            : Promise.resolve({ data: [] }),
          stageIds.length > 0 
            ? supabase.from('member_stage_scores').select('*').in('stage_id', stageIds)
            : Promise.resolve({ data: [] }),
          supabase.from('member_final_scores').select('*').eq('group_id', groupId),
        ]);

        taskScores = taskScoresData || [];
        stageScores = stageScoresData || [];
        finalScores = finalScoresData || [];
      }

      setProgress(70);
      setProgressMessage('Đang tải tài nguyên...');

      // Fetch resources
      let resources: any[] = [];
      if (options.includeResources) {
        const { data: resourcesData } = await supabase
          .from('project_resources')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false });
        resources = resourcesData || [];
      }

      setProgress(80);
      setProgressMessage('Đang tải nhật ký...');

      // Fetch activity logs
      let activityLogs: any[] = [];
      if (options.includeLogs) {
        const { data: logsData } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: false })
          .limit(500);
        activityLogs = logsData || [];
      }

      setProgress(90);
      setProgressMessage('Đang tạo PDF...');

      // Generate PDF
      const exportData: ExportData = {
        project: project as Group,
        members,
        stages: (stagesData || []) as Stage[],
        tasks,
        taskScores,
        stageScores,
        finalScores,
        resources,
        activityLogs,
        options,
      };

      const fileName = exportProjectEvidencePdf(exportData);

      setProgress(100);
      setProgressMessage('Hoàn tất!');

      toast({
        title: 'Xuất PDF thành công',
        description: `File ${fileName} đã được tải xuống`,
      });

    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Lỗi xuất PDF',
        description: error.message || 'Không thể xuất báo cáo minh chứng',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  const optionItems = [
    { key: 'includeMembers' as const, label: 'Thông tin thành viên', icon: Users },
    { key: 'includeTasks' as const, label: 'Chi tiết công việc (Tasks)', icon: ListTodo },
    { key: 'includeScores' as const, label: 'Điểm quá trình', icon: Award },
    { key: 'includeResources' as const, label: 'Tài nguyên dự án', icon: FolderOpen },
    { key: 'includeLogs' as const, label: 'Nhật ký hoạt động', icon: History },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <FileText className="w-5 h-5" />
          Xuất Minh chứng
        </CardTitle>
        <CardDescription>
          Xuất toàn bộ dữ liệu dự án ra file PDF với thương hiệu UEH
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Options */}
        <div className="space-y-3">
          {optionItems.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center space-x-3">
              <Checkbox
                id={key}
                checked={options[key]}
                onCheckedChange={() => handleOptionChange(key)}
                disabled={isExporting}
              />
              <Label
                htmlFor={key}
                className="flex items-center gap-2 text-sm font-normal cursor-pointer"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                {label}
              </Label>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {isExporting && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {progressMessage}
            </p>
          </div>
        )}

        {/* Export button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang xuất...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Xuất PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
