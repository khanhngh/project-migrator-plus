import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UserAvatar from '@/components/UserAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Target,
  Users,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Edit2,
  UserCheck,
  UsersRound,
  Award,
  Percent,
  Zap,
  X,
  Sparkles,
} from 'lucide-react';
import type { Task, GroupMember } from '@/types/database';
import type { TaskScore } from '@/types/processScores';

interface TaskScoringDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  members: GroupMember[];
  taskScores: TaskScore[];
  onScoreUpdated: () => void;
}

interface MemberScoreEdit {
  userId: string;
  scoreId: string | null;
  adjustment: number;
  reason: string;
  currentScore: number;
  isScored: boolean;
  isEditing: boolean;
}

// Quick score presets for fast scoring
const QUICK_SCORES = [
  { value: 0, label: '100', description: 'Hoàn thành tốt', color: 'bg-green-500 hover:bg-green-600' },
  { value: -5, label: '95', description: 'Tốt, thiếu sót nhỏ', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { value: -10, label: '90', description: 'Khá tốt', color: 'bg-blue-500 hover:bg-blue-600' },
  { value: -20, label: '80', description: 'Đạt yêu cầu', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { value: -30, label: '70', description: 'Cần cải thiện', color: 'bg-orange-500 hover:bg-orange-600' },
  { value: -50, label: '50', description: 'Yếu', color: 'bg-red-500 hover:bg-red-600' },
];

export default function TaskScoringDialog({
  isOpen,
  onClose,
  task,
  members,
  taskScores,
  onScoreUpdated,
}: TaskScoringDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [memberEdits, setMemberEdits] = useState<MemberScoreEdit[]>([]);
  const [scoringMode, setScoringMode] = useState<'quick' | 'group' | 'individual'>('quick');
  
  // Group scoring state
  const [groupAdjustment, setGroupAdjustment] = useState(0);
  const [groupReason, setGroupReason] = useState('');

  // Get task assignees
  const taskAssigneeIds = useMemo(() => 
    task?.task_assignments?.map((a: any) => a.user_id) || [], 
    [task]
  );
  
  const assignedMembers = useMemo(() => 
    members.filter(m => taskAssigneeIds.includes(m.user_id)),
    [members, taskAssigneeIds]
  );

  useEffect(() => {
    if (isOpen && task) {
      const edits: MemberScoreEdit[] = assignedMembers.map(member => {
        const existingScore = taskScores.find(
          ts => ts.task_id === task.id && ts.user_id === member.user_id
        );
        
        const isExplicitlyScored = existingScore ? 
          (existingScore.adjusted_by !== null || (existingScore.adjustment ?? 0) !== 0) : 
          false;
        
        return {
          userId: member.user_id,
          scoreId: existingScore?.id || null,
          adjustment: existingScore?.adjustment || 0,
          reason: existingScore?.adjustment_reason || '',
          currentScore: existingScore?.final_score || 100,
          isScored: isExplicitlyScored,
          isEditing: false,
        };
      });
      setMemberEdits(edits);
      setGroupAdjustment(0);
      setGroupReason('');
    }
  }, [isOpen, task, taskScores, assignedMembers]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-primary';
    if (score >= 50) return 'text-yellow-600';
    return 'text-destructive';
  };

  const getAdjustmentIcon = (adjustment: number) => {
    if (adjustment > 0) return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (adjustment < 0) return <TrendingDown className="w-3 h-3 text-destructive" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  const toggleEditing = (userId: string) => {
    setMemberEdits(prev =>
      prev.map(e =>
        e.userId === userId ? { ...e, isEditing: !e.isEditing } : e
      )
    );
  };

  const updateMemberScore = (userId: string, field: 'adjustment' | 'reason', value: any) => {
    setMemberEdits(prev =>
      prev.map(e => {
        if (e.userId === userId) {
          const updated = { ...e, [field]: value };
          if (field === 'adjustment') {
            updated.currentScore = 100 + Number(value);
          }
          return updated;
        }
        return e;
      })
    );
  };

  // Batch save for quick scoring
  const handleQuickScoreAll = async (adjustment: number, reason: string) => {
    if (!task || !user || assignedMembers.length === 0) return;

    setIsLoading(true);
    try {
      const newScore = 100 + adjustment;
      const updates: Promise<any>[] = [];
      const historyInserts: any[] = [];

      for (const member of assignedMembers) {
        const existingScore = taskScores.find(
          ts => ts.task_id === task.id && ts.user_id === member.user_id
        );

        if (existingScore) {
          updates.push(
            (async () => {
              await supabase
                .from('task_scores')
                .update({
                  adjustment,
                  adjustment_reason: reason,
                  adjusted_by: user.id,
                  adjusted_at: new Date().toISOString(),
                  final_score: newScore,
                })
                .eq('id', existingScore.id);
              
              historyInserts.push({
                adjustment_type: 'task',
                target_id: existingScore.id,
                user_id: member.user_id,
                previous_score: existingScore.final_score || 100,
                new_score: newScore,
                adjustment_value: adjustment,
                reason: reason || 'Chấm điểm nhanh',
                adjusted_by: user.id,
              });
            })()
          );
        } else {
          updates.push(
            (async () => {
              const { data } = await supabase
                .from('task_scores')
                .insert({
                  task_id: task.id,
                  user_id: member.user_id,
                  base_score: 100,
                  adjustment,
                  adjustment_reason: reason,
                  adjusted_by: user.id,
                  adjusted_at: new Date().toISOString(),
                  final_score: newScore,
                })
                .select()
                .single();

              if (data) {
                historyInserts.push({
                  adjustment_type: 'task',
                  target_id: data.id,
                  user_id: member.user_id,
                  previous_score: 100,
                  new_score: newScore,
                  adjustment_value: adjustment,
                  reason: reason || 'Chấm điểm nhanh',
                  adjusted_by: user.id,
                });
              }
            })()
          );
        }
      }

      await Promise.all(updates);
      
      if (historyInserts.length > 0) {
        await supabase.from('score_adjustment_history').insert(historyInserts);
      }

      toast({ 
        title: 'Đã chấm điểm nhanh!',
        description: `${assignedMembers.length} thành viên được chấm ${newScore} điểm`
      });
      onScoreUpdated();
      onClose();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Save individual member score
  const handleSaveScore = async (edit: MemberScoreEdit) => {
    if (!task || !user) return;

    setIsLoading(true);
    try {
      const newScore = 100 + edit.adjustment;

      if (edit.scoreId) {
        const existingScore = taskScores.find(ts => ts.id === edit.scoreId);
        const previousScore = existingScore?.final_score || 100;

        await supabase
          .from('task_scores')
          .update({
            adjustment: edit.adjustment,
            adjustment_reason: edit.reason || null,
            adjusted_by: user.id,
            adjusted_at: new Date().toISOString(),
            final_score: newScore,
          })
          .eq('id', edit.scoreId);

        await supabase.from('score_adjustment_history').insert([{
          adjustment_type: 'task',
          target_id: edit.scoreId,
          user_id: edit.userId,
          previous_score: previousScore,
          new_score: newScore,
          adjustment_value: edit.adjustment,
          reason: edit.reason || 'Chấm điểm task',
          adjusted_by: user.id,
        }]);
      } else {
        const { data: newScoreData, error } = await supabase
          .from('task_scores')
          .insert([{
            task_id: task.id,
            user_id: edit.userId,
            base_score: 100,
            adjustment: edit.adjustment,
            adjustment_reason: edit.reason || null,
            adjusted_by: user.id,
            adjusted_at: new Date().toISOString(),
            final_score: newScore,
          }])
          .select()
          .single();

        if (error) throw error;

        await supabase.from('score_adjustment_history').insert([{
          adjustment_type: 'task',
          target_id: newScoreData.id,
          user_id: edit.userId,
          previous_score: 100,
          new_score: newScore,
          adjustment_value: edit.adjustment,
          reason: edit.reason || 'Chấm điểm task',
          adjusted_by: user.id,
        }]);
      }

      toast({ title: 'Đã lưu điểm' });
      toggleEditing(edit.userId);
      onScoreUpdated();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Save group score
  const handleSaveGroupScore = async () => {
    if (!task || !user || assignedMembers.length === 0) return;
    await handleQuickScoreAll(groupAdjustment, groupReason);
  };

  const { scoredCount, totalCount } = useMemo(() => ({
    scoredCount: memberEdits.filter(e => e.isScored).length,
    totalCount: memberEdits.length,
  }), [memberEdits]);

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[900px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Compact Header */}
        <DialogHeader className="shrink-0 p-5 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold line-clamp-1">{task.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="outline" className="gap-1 text-xs">
                  <Users className="w-3 h-3" />
                  {totalCount} người
                </Badge>
                {scoredCount === totalCount && totalCount > 0 ? (
                  <Badge className="bg-green-500 gap-1 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Đã chấm đủ
                  </Badge>
                ) : scoredCount > 0 ? (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    {scoredCount}/{totalCount} đã chấm
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                    Chưa chấm
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={scoringMode} onValueChange={(v) => setScoringMode(v as any)} className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 px-5 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick" className="gap-1.5 text-xs">
                <Zap className="w-3.5 h-3.5" />
                Chấm nhanh
              </TabsTrigger>
              <TabsTrigger value="group" className="gap-1.5 text-xs">
                <UsersRound className="w-3.5 h-3.5" />
                Theo nhóm
              </TabsTrigger>
              <TabsTrigger value="individual" className="gap-1.5 text-xs">
                <UserCheck className="w-3.5 h-3.5" />
                Riêng lẻ
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Quick Scoring Tab - NEW */}
          <TabsContent value="quick" className="flex-1 overflow-auto px-5 pb-5 mt-4">
            <div className="space-y-4">
              {/* Quick Score Buttons Grid */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Chọn mức điểm cho tất cả {totalCount} thành viên:</Label>
                <div className="grid grid-cols-3 gap-3">
                  {QUICK_SCORES.map((preset) => (
                    <Button
                      key={preset.value}
                      variant="outline"
                      className={`h-auto py-4 flex flex-col items-center gap-1 border-2 hover:border-primary/50 transition-all ${isLoading ? 'opacity-50' : ''}`}
                      onClick={() => handleQuickScoreAll(preset.value, preset.description)}
                      disabled={isLoading || totalCount === 0}
                    >
                      <span className={`text-2xl font-bold ${getScoreColor(100 + preset.value)}`}>
                        {preset.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{preset.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Members Preview */}
              <div className="p-4 rounded-xl bg-muted/50 border">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Thành viên sẽ được chấm điểm:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {assignedMembers.map(member => {
                    const edit = memberEdits.find(e => e.userId === member.user_id);
                    return (
                      <div 
                        key={member.user_id} 
                        className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border"
                      >
                        <UserAvatar 
                          src={member.profiles?.avatar_url}
                          name={member.profiles?.full_name}
                          size="xs"
                        />
                        <span className="text-sm">{member.profiles?.full_name}</span>
                        {edit?.isScored && (
                          <Badge variant="secondary" className="text-xs h-5 px-1.5">
                            {edit.currentScore}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-primary py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang lưu điểm...</span>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Group Scoring Tab */}
          <TabsContent value="group" className="flex-1 overflow-auto px-5 pb-5 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Chấm điểm tùy chỉnh cho cả nhóm
                </CardTitle>
                <CardDescription>
                  Nhập mức điều chỉnh điểm và lý do
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Score Preview */}
                <div className="flex items-center justify-center gap-6 p-5 bg-muted/50 rounded-xl">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Điểm gốc</p>
                    <span className="text-2xl font-bold">100</span>
                  </div>
                  <div className="text-center">
                    {getAdjustmentIcon(groupAdjustment)}
                    <p className="text-xs text-muted-foreground mb-1">Điều chỉnh</p>
                    <span className={`text-2xl font-bold ${groupAdjustment > 0 ? 'text-green-500' : groupAdjustment < 0 ? 'text-destructive' : ''}`}>
                      {groupAdjustment > 0 ? '+' : ''}{groupAdjustment}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Điểm cuối</p>
                    <span className={`text-3xl font-bold ${getScoreColor(100 + groupAdjustment)}`}>
                      {100 + groupAdjustment}
                    </span>
                  </div>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Điều chỉnh điểm</Label>
                    <Input
                      type="number"
                      value={groupAdjustment}
                      onChange={(e) => setGroupAdjustment(Number(e.target.value))}
                      min={-100}
                      max={100}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Lý do {groupAdjustment !== 0 && <span className="text-destructive">*</span>}
                    </Label>
                    <Textarea
                      value={groupReason}
                      onChange={(e) => setGroupReason(e.target.value)}
                      placeholder="Nhập lý do..."
                      rows={2}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveGroupScore}
                  disabled={isLoading || (groupAdjustment !== 0 && !groupReason.trim()) || totalCount === 0}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Chấm điểm cho {totalCount} thành viên
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Individual Scoring Tab */}
          <TabsContent value="individual" className="flex-1 overflow-hidden px-5 pb-5 mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-2">
                {memberEdits.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Chưa có thành viên nào được giao task này</p>
                  </div>
                ) : (
                  memberEdits.map(edit => {
                    const member = members.find(m => m.user_id === edit.userId);
                    const profile = member?.profiles;

                    return (
                      <Card
                        key={edit.userId}
                        className={`transition-all ${
                          edit.isEditing
                            ? 'border-primary/50 bg-primary/5 shadow-md'
                            : 'hover:bg-muted/30'
                        }`}
                      >
                        <CardContent className="p-3">
                          {/* Member Row */}
                          <div className="flex items-center gap-3">
                            <UserAvatar 
                              src={profile?.avatar_url}
                              name={profile?.full_name}
                              size="md"
                            />

                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{profile?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{profile?.student_id}</p>
                            </div>

                            {!edit.isEditing && (
                              <>
                                <div className="flex items-center gap-2">
                                  {edit.isScored ? (
                                    <>
                                      {edit.adjustment !== 0 && (
                                        <Badge
                                          variant={edit.adjustment > 0 ? 'default' : 'destructive'}
                                          className={`text-xs ${edit.adjustment > 0 ? 'bg-green-500' : ''}`}
                                        >
                                          {edit.adjustment > 0 ? '+' : ''}{edit.adjustment}
                                        </Badge>
                                      )}
                                      <span className={`text-xl font-bold ${getScoreColor(edit.currentScore)}`}>
                                        {edit.currentScore}
                                      </span>
                                    </>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground text-xs">
                                      Chưa chấm
                                    </Badge>
                                  )}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleEditing(edit.userId)}
                                  className="gap-1 h-8"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  {edit.isScored ? 'Sửa' : 'Chấm'}
                                </Button>
                              </>
                            )}
                          </div>

                          {/* Editing Form */}
                          {edit.isEditing && (
                            <div className="mt-3 space-y-3 pt-3 border-t">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Điều chỉnh điểm</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      value={edit.adjustment}
                                      onChange={e =>
                                        updateMemberScore(edit.userId, 'adjustment', Number(e.target.value))
                                      }
                                      className="h-9"
                                      min={-100}
                                      max={100}
                                    />
                                    <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 bg-muted rounded-lg">
                                      {getAdjustmentIcon(edit.adjustment)}
                                      <span className={`text-base font-bold ${getScoreColor(edit.currentScore)}`}>
                                        = {edit.currentScore}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">
                                    Lý do {edit.adjustment !== 0 && <span className="text-destructive">*</span>}
                                  </Label>
                                  <Textarea
                                    value={edit.reason}
                                    onChange={e => updateMemberScore(edit.userId, 'reason', e.target.value)}
                                    placeholder="Nhập lý do..."
                                    rows={1}
                                    className="resize-none"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleEditing(edit.userId)}
                                  disabled={isLoading}
                                >
                                  Hủy
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveScore(edit)}
                                  disabled={isLoading || (edit.adjustment !== 0 && !edit.reason.trim())}
                                >
                                  {isLoading ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <Save className="w-3 h-3 mr-1" />
                                  )}
                                  Lưu
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
