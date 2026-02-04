import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  File, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  Archive,
  FileSpreadsheet,
  Presentation,
  Trash2, 
  Download, 
  Search, 
  FolderOpen,
  FolderPlus,
  Folder,
  Plus,
  Loader2,
  Eye,
  Filter,
  Calendar,
  User,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Pencil
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectResource {
  id: string;
  group_id: string;
  name: string;
  file_path: string;
  storage_name: string;
  file_size: number;
  file_type: string | null;
  category: string | null;
  description: string | null;
  uploaded_by: string;
  created_at: string;
  folder_id: string | null;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ResourceFolder {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

interface ProjectResourcesProps {
  groupId: string;
  isLeader: boolean;
}

const CATEGORIES = [
  { value: 'general', label: 'Tài liệu chung', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  { value: 'template', label: 'Mẫu/Template', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  { value: 'reference', label: 'Tham khảo', color: 'bg-green-500/10 text-green-600 border-green-200' },
  { value: 'guide', label: 'Hướng dẫn', color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  { value: 'plugin', label: 'Plugin/Công cụ', color: 'bg-pink-500/10 text-pink-600 border-pink-200' },
];

function getFileIcon(fileName: string, size: 'sm' | 'md' = 'sm') {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconClass = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  
  switch (ext) {
    case 'pdf':
      return <FileText className={cn(iconClass, 'text-red-500')} />;
    case 'doc':
    case 'docx':
      return <FileText className={cn(iconClass, 'text-blue-500')} />;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <FileSpreadsheet className={cn(iconClass, 'text-green-500')} />;
    case 'ppt':
    case 'pptx':
      return <Presentation className={cn(iconClass, 'text-orange-500')} />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return <ImageIcon className={cn(iconClass, 'text-purple-500')} />;
    case 'mp4':
    case 'webm':
    case 'mov':
    case 'avi':
      return <Video className={cn(iconClass, 'text-pink-500')} />;
    case 'mp3':
    case 'wav':
    case 'ogg':
      return <Music className={cn(iconClass, 'text-cyan-500')} />;
    case 'zip':
    case 'rar':
    case '7z':
      return <Archive className={cn(iconClass, 'text-amber-500')} />;
    default:
      return <File className={cn(iconClass, 'text-muted-foreground')} />;
  }
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
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderFileInputRef = useRef<HTMLInputElement>(null);
  
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // Upload dialog
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('general');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadToFolder, setUploadToFolder] = useState<string | null>(null);
  
  // Folder dialog
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ResourceFolder | null>(null);
  
  // Delete dialog
  const [deleteResource, setDeleteResource] = useState<ProjectResource | null>(null);
  const [deleteFolder, setDeleteFolder] = useState<ResourceFolder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Rename file dialog
  const [renameResource, setRenameResource] = useState<ProjectResource | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    fetchResources();
    fetchFolders();
  }, [groupId]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_folders' as any)
        .select('*')
        .eq('group_id', groupId)
        .order('name', { ascending: true }) as any;
      
      if (error) throw error;
      setFolders((data || []) as ResourceFolder[]);
    } catch (error: any) {
      console.error('Error fetching folders:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from('project_resources')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const uploaderIds = [...new Set(data.map(r => r.uploaded_by))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', uploaderIds);
        
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        setResources(data.map(r => ({
          ...r,
          folder_id: (r as any).folder_id || null,
          profiles: profilesMap.get(r.uploaded_by)
        })) as ProjectResource[]);
      } else {
        setResources([]);
      }
    } catch (error: any) {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách tài nguyên', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, folderId: string | null = null) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: 'Lỗi', description: 'File quá lớn. Giới hạn 50MB.', variant: 'destructive' });
        return;
      }
      setUploadFile(file);
      setUploadToFolder(folderId);
      setIsUploadOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Chưa đăng nhập');

      const fileExt = uploadFile.name.split('.').pop();
      const storageName = `${groupId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-resources')
        .upload(storageName, uploadFile);
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('project-resources')
        .getPublicUrl(storageName);
      
      const { error: insertError } = await (supabase
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
          uploaded_by: userData.user.id,
          folder_id: uploadToFolder
        } as any) as any);
      
      if (insertError) throw insertError;
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({ title: 'Thành công', description: 'Đã tải lên tài nguyên' });
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadCategory('general');
      setUploadDescription('');
      setUploadToFolder(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderFileInputRef.current) folderFileInputRef.current.value = '';
      fetchResources();
    } catch (error: any) {
      clearInterval(progressInterval);
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    
    setIsCreatingFolder(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Chưa đăng nhập');

      if (editingFolder) {
        const { error } = await (supabase
          .from('resource_folders' as any)
          .update({
            name: folderName.trim(),
            description: folderDescription || null
          })
          .eq('id', editingFolder.id) as any);
        
        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã cập nhật thư mục' });
      } else {
        const { error } = await (supabase
          .from('resource_folders' as any)
          .insert({
            group_id: groupId,
            name: folderName.trim(),
            description: folderDescription || null,
            created_by: userData.user.id
          }) as any);
        
        if (error) throw error;
        toast({ title: 'Thành công', description: 'Đã tạo thư mục mới' });
      }
      
      setIsFolderDialogOpen(false);
      setFolderName('');
      setFolderDescription('');
      setEditingFolder(null);
      fetchFolders();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolder) return;
    
    setIsDeleting(true);
    try {
      // First, move all files in the folder to root
      const { error: updateError } = await (supabase
        .from('project_resources')
        .update({ folder_id: null } as any)
        .eq('folder_id', deleteFolder.id) as any);
      
      if (updateError) throw updateError;
      
      const { error: deleteError } = await (supabase
        .from('resource_folders' as any)
        .delete()
        .eq('id', deleteFolder.id) as any);
      
      if (deleteError) throw deleteError;
      
      toast({ title: 'Thành công', description: 'Đã xóa thư mục (các file được chuyển về gốc)' });
      setDeleteFolder(null);
      fetchFolders();
      fetchResources();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteResource) return;
    
    setIsDeleting(true);
    try {
      await supabase.storage
        .from('project-resources')
        .remove([deleteResource.storage_name]);
      
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

  const handleRenameFile = async () => {
    if (!renameResource || !newFileName.trim()) return;
    
    setIsRenaming(true);
    try {
      // Keep the original extension
      const originalExt = renameResource.name.split('.').pop();
      const newNameWithoutExt = newFileName.trim().replace(/\.[^/.]+$/, ''); // Remove any extension user might have typed
      const finalName = originalExt ? `${newNameWithoutExt}.${originalExt}` : newNameWithoutExt;
      
      const { error } = await supabase
        .from('project_resources')
        .update({ name: finalName })
        .eq('id', renameResource.id);
      
      if (error) throw error;
      
      toast({ title: 'Thành công', description: 'Đã đổi tên file' });
      setRenameResource(null);
      setNewFileName('');
      fetchResources();
    } catch (error: any) {
      toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    } finally {
      setIsRenaming(false);
    }
  };

  const handlePreview = (resource: ProjectResource) => {
    const params = new URLSearchParams();
    params.set('url', resource.file_path);
    params.set('name', resource.name);
    params.set('size', resource.file_size.toString());
    params.set('source', 'resource');
    navigate(`/file-preview?${params.toString()}`);
  };

  const handleDownload = (resource: ProjectResource) => {
    window.open(resource.file_path, '_blank');
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const openEditFolder = (folder: ResourceFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDescription(folder.description || '');
    setIsFolderDialogOpen(true);
  };

  // Filter resources
  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group resources by folder
  const rootResources = filteredResources.filter(r => !r.folder_id);
  const getResourcesInFolder = (folderId: string) => 
    filteredResources.filter(r => r.folder_id === folderId);

  const renderResourceItem = (resource: ProjectResource) => {
    const category = CATEGORIES.find(c => c.value === resource.category);
    
    return (
      <Card 
        key={resource.id} 
        className="group hover:shadow-md transition-all hover:border-primary/30 cursor-pointer"
        onClick={() => handlePreview(resource)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 border">
              {getFileIcon(resource.name, 'md')}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-sm truncate max-w-[200px] sm:max-w-none" title={resource.name}>
                  {resource.name}
                </h4>
                {category && (
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", category.color)}>
                    {category.label}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <File className="w-3 h-3" />
                  {formatFileSize(resource.file_size)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(resource.created_at), 'dd/MM/yyyy', { locale: vi })}
                </span>
                <span className="flex items-center gap-1 hidden sm:flex">
                  <User className="w-3 h-3" />
                  {resource.profiles?.full_name || 'Unknown'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); handlePreview(resource); }}
                title="Xem trước"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); handleDownload(resource); }}
                title="Tải xuống"
              >
                <Download className="w-4 h-4" />
              </Button>
              {isLeader && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const nameWithoutExt = resource.name.substring(0, resource.name.lastIndexOf('.')) || resource.name;
                      setNewFileName(nameWithoutExt);
                      setRenameResource(resource); 
                    }}
                    title="Đổi tên"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setDeleteResource(resource); }}
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e, null)}
      />
      <input
        ref={folderFileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e, uploadToFolder)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Tài nguyên dự án
            <Badge variant="secondary" className="ml-2">{resources.length}</Badge>
          </h2>
        </div>
        
        {isLeader && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setEditingFolder(null);
                setFolderName('');
                setFolderDescription('');
                setIsFolderDialogOpen(true);
              }}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Tạo thư mục
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Tải lên
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài nguyên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-44 h-9">
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

      {/* Folders and Resources */}
      {folders.length === 0 && filteredResources.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-lg">Chưa có tài nguyên</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isLeader ? 'Tải lên tài liệu hoặc tạo thư mục cho dự án' : 'Chưa có tài nguyên nào được chia sẻ'}
            </p>
            {isLeader && (
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsFolderDialogOpen(true)}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Tạo thư mục
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tải lên file
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Folders */}
          {folders.map(folder => {
            const folderResources = getResourcesInFolder(folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            
            return (
              <Collapsible key={folder.id} open={isExpanded} onOpenChange={() => toggleFolder(folder.id)}>
                <Card className="overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/10 flex items-center justify-center shrink-0 border border-amber-200">
                        <Folder className="w-5 h-5 text-amber-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{folder.name}</h4>
                          <Badge variant="secondary" className="text-[10px]">
                            {folderResources.length} file
                          </Badge>
                        </div>
                        {folder.description && (
                          <p className="text-xs text-muted-foreground truncate">{folder.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {isLeader && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                setUploadToFolder(folder.id);
                                folderFileInputRef.current?.click();
                              }}>
                                <Upload className="w-4 h-4 mr-2" />
                                Tải file vào đây
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                openEditFolder(folder);
                              }}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Sửa thư mục
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteFolder(folder);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Xóa thư mục
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t bg-muted/30 p-2 space-y-2">
                      {folderResources.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          Thư mục trống
                          {isLeader && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="ml-2"
                              onClick={() => {
                                setUploadToFolder(folder.id);
                                folderFileInputRef.current?.click();
                              }}
                            >
                              Tải file lên
                            </Button>
                          )}
                        </div>
                      ) : (
                        folderResources.map(resource => renderResourceItem(resource))
                      )}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}

          {/* Root level resources */}
          {rootResources.length > 0 && (
            <div className="space-y-2">
              {folders.length > 0 && (
                <h3 className="text-sm font-medium text-muted-foreground px-1">File không thuộc thư mục</h3>
              )}
              {rootResources.map(resource => renderResourceItem(resource))}
            </div>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Tải lên tài nguyên
            </DialogTitle>
            <DialogDescription>
              {uploadToFolder 
                ? `Thêm file vào thư mục "${folders.find(f => f.id === uploadToFolder)?.name}"`
                : 'Thêm tài liệu, mẫu hoặc công cụ vào dự án'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Preview */}
            {uploadFile && (
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg border">
                <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center border">
                  {getFileIcon(uploadFile.name, 'md')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{uploadFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                </div>
              </div>
            )}
            
            {/* Category Select */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Phân loại</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[10px]", cat.color)}>
                          {cat.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mô tả (tùy chọn)</Label>
              <Input
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Mô tả ngắn về tài nguyên..."
              />
            </div>
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Đang tải lên...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || !uploadFile}
              className="gap-2"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Đang tải...</>
              ) : (
                <><Upload className="w-4 h-4" />Tải lên</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-primary" />
              {editingFolder ? 'Sửa thư mục' : 'Tạo thư mục mới'}
            </DialogTitle>
            <DialogDescription>
              Tổ chức tài nguyên theo thư mục
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên thư mục</Label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="VD: Tài liệu tham khảo..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Mô tả (tùy chọn)</Label>
              <Input
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                placeholder="Mô tả ngắn về thư mục..."
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleCreateFolder} 
              disabled={isCreatingFolder || !folderName.trim()}
              className="gap-2"
            >
              {isCreatingFolder ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FolderPlus className="w-4 h-4" />
              )}
              {editingFolder ? 'Cập nhật' : 'Tạo thư mục'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Resource Confirmation */}
      <AlertDialog open={!!deleteResource} onOpenChange={() => setDeleteResource(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa file</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa "{deleteResource?.name}"? Hành động này không thể hoàn tác.
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

      {/* Delete Folder Confirmation */}
      <AlertDialog open={!!deleteFolder} onOpenChange={() => setDeleteFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa thư mục</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa thư mục "{deleteFolder?.name}"? Các file trong thư mục sẽ được chuyển về gốc.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFolder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename File Dialog */}
      <Dialog open={!!renameResource} onOpenChange={() => setRenameResource(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Đổi tên file
            </DialogTitle>
            <DialogDescription>
              Nhập tên mới cho file (phần mở rộng sẽ được giữ nguyên)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tên file mới</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Nhập tên file..."
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameFile()}
                  autoFocus
                />
                <span className="text-sm text-muted-foreground shrink-0">
                  .{renameResource?.name.split('.').pop()}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRenameResource(null)}>
              Hủy
            </Button>
            <Button 
              onClick={handleRenameFile} 
              disabled={isRenaming || !newFileName.trim()}
              className="gap-2"
            >
              {isRenaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Pencil className="w-4 h-4" />
              )}
              Đổi tên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
