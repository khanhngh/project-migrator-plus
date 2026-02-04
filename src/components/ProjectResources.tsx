import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  Trash2, 
  Download, 
  Search, 
  FolderOpen,
  Plus,
  Loader2,
  Eye,
  MoreVertical,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ProjectResource {
  id: string;
  group_id: string;
  name: string;
  file_path: string;
  storage_name: string;
  file_size: number;
  file_type: string | null;
  category: string;
  description: string | null;
  uploaded_by: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ProjectResourcesProps {
  groupId: string;
  isLeader: boolean;
}

const CATEGORIES = [
  { value: 'general', label: 'Tài liệu chung', color: 'bg-blue-500/10 text-blue-600' },
  { value: 'template', label: 'Mẫu/Template', color: 'bg-purple-500/10 text-purple-600' },
  { value: 'reference', label: 'Tham khảo', color: 'bg-green-500/10 text-green-600' },
  { value: 'guide', label: 'Hướng dẫn', color: 'bg-orange-500/10 text-orange-600' },
  { value: 'plugin', label: 'Plugin/Công cụ', color: 'bg-pink-500/10 text-pink-600' },
];

function getFileIcon(fileType: string | null) {
  if (!fileType) return File;
  if (fileType.startsWith('image/')) return Image;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('audio/')) return Music;
  if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('word')) return FileText;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return Archive;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function ProjectResources({ groupId, isLeader }: ProjectResourcesProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Upload dialog
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('general');
  const [uploadDescription, setUploadDescription] = useState('');
  
  // Delete dialog
  const [deleteResource, setDeleteResource] = useState<ProjectResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchResources();
  }, [groupId]);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('project_resources')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch uploader profiles
      if (data && data.length > 0) {
        const uploaderIds = [...new Set(data.map(r => r.uploaded_by))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', uploaderIds);
        
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        setResources(data.map(r => ({
          ...r,
          profiles: profilesMap.get(r.uploaded_by)
        })));
      } else {
        setResources([]);
      }
    } catch (error: any) {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách tài nguyên', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 50MB limit
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: 'Lỗi', description: 'File quá lớn. Giới hạn 50MB.', variant: 'destructive' });
        return;
      }
      setUploadFile(file);
      setIsUploadOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    
    setIsUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Chưa đăng nhập');

      // Generate unique storage name
      const fileExt = uploadFile.name.split('.').pop();
      const storageName = `${groupId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('project-resources')
        .upload(storageName, uploadFile);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('project-resources')
        .getPublicUrl(storageName);
      
      // Insert metadata
      const { error: insertError } = await supabase
        .from('project_resources')
        .insert({
          group_id: groupId,
          name: uploadFile.name,
          file_path: urlData.publicUrl,
          storage_name: storageName,
          file_size: uploadFile.size,
          file_type: uploadFile.type,
          category: uploadCategory,
          description: uploadDescription || null,
          uploaded_by: userData.user.id
        });
      
      if (insertError) throw insertError;
      
      toast({ title: 'Thành công', description: 'Đã tải lên tài nguyên' });
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadCategory('general');
      setUploadDescription('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchResources();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteResource) return;
    
    setIsDeleting(true);
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-resources')
        .remove([deleteResource.storage_name]);
      
      if (storageError) console.warn('Storage delete warning:', storageError);
      
      // Delete metadata
      const { error: dbError } = await supabase
        .from('project_resources')
        .delete()
        .eq('id', deleteResource.id);
      
      if (dbError) throw dbError;
      
      toast({ title: 'Thành công', description: 'Đã xóa tài nguyên' });
      setDeleteResource(null);
      fetchResources();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = (resource: ProjectResource) => {
    window.open(resource.file_path, '_blank');
  };

  // Filter resources
  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Tài nguyên dự án
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý tài liệu, mẫu và công cụ cho dự án
          </p>
        </div>
        
        {isLeader && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Tải lên
            </Button>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài nguyên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Phân loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg">Chưa có tài nguyên</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isLeader ? 'Tải lên tài liệu, mẫu hoặc công cụ cho dự án' : 'Chưa có tài nguyên nào được chia sẻ'}
            </p>
            {isLeader && (
              <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                <Plus className="w-4 h-4 mr-2" />
                Tải lên tài nguyên đầu tiên
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(resource => {
            const FileIcon = getFileIcon(resource.file_type);
            const category = CATEGORIES.find(c => c.value === resource.category);
            
            return (
              <Card key={resource.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate" title={resource.name}>
                        {resource.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(resource.file_size)}
                        </span>
                        {category && (
                          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", category.color)}>
                            {category.label}
                          </Badge>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {resource.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(resource)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Xem/Tải xuống
                        </DropdownMenuItem>
                        {isLeader && (
                          <DropdownMenuItem 
                            onClick={() => setDeleteResource(resource)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      Tải lên bởi {resource.profiles?.full_name || 'Unknown'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tải lên tài nguyên</DialogTitle>
            <DialogDescription>
              Thêm tài liệu, mẫu hoặc công cụ vào dự án
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {uploadFile && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <File className="w-8 h-8 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{uploadFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Phân loại</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Mô tả (tùy chọn)</Label>
              <Input
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Mô tả ngắn về tài nguyên..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !uploadFile}>
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang tải...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Tải lên</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteResource} onOpenChange={() => setDeleteResource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa tài nguyên "{deleteResource?.name}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
