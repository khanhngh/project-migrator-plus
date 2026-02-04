import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Group, GroupMember, Task, Stage } from '@/types/database';

// UEH Brand Colors
const UEH_TEAL: [number, number, number] = [26, 107, 109];
const UEH_ORANGE: [number, number, number] = [224, 123, 57];
const UEH_TEAL_LIGHT: [number, number, number] = [230, 243, 243];

// Remove Vietnamese diacritics for PDF compatibility
export const removeVietnameseDiacritics = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

interface ActivityLog {
  id: string;
  action: string;
  action_type: string;
  description: string | null;
  user_name: string;
  created_at: string;
}

interface ProjectResource {
  id: string;
  name: string;
  category: string | null;
  file_size: number;
  created_at: string;
  uploaded_by: string;
}

interface TaskScore {
  id: string;
  task_id: string;
  user_id: string;
  final_score: number | null;
}

interface StageScore {
  id: string;
  stage_id: string;
  user_id: string;
  final_stage_score: number | null;
}

interface FinalScore {
  id: string;
  user_id: string;
  final_score: number | null;
}

export interface ExportOptions {
  includeMembers: boolean;
  includeTasks: boolean;
  includeScores: boolean;
  includeResources: boolean;
  includeLogs: boolean;
}

export interface ExportData {
  project: Group;
  members: GroupMember[];
  stages: Stage[];
  tasks: Task[];
  taskScores: TaskScore[];
  stageScores: StageScore[];
  finalScores: FinalScore[];
  resources: ProjectResource[];
  activityLogs: ActivityLog[];
  options: ExportOptions;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  member: 'Thanh vien',
  stage: 'Giai doan',
  task: 'Task',
  resource: 'Tai nguyen',
};

const formatAction = (action: string): string => {
  const actionMap: Record<string, string> = {
    'ADD_MEMBER': 'Them thanh vien',
    'REMOVE_MEMBER': 'Xoa thanh vien',
    'UPDATE_MEMBER': 'Cap nhat thanh vien',
    'CREATE_AND_ADD_MEMBER': 'Tao va them thanh vien',
    'CREATE_STAGE': 'Tao giai doan',
    'UPDATE_STAGE': 'Cap nhat giai doan',
    'DELETE_STAGE': 'Xoa giai doan',
    'CREATE_TASK': 'Tao task',
    'UPDATE_TASK': 'Cap nhat task',
    'DELETE_TASK': 'Xoa task',
    'SUBMISSION': 'Nop bai',
    'LATE_SUBMISSION': 'Nop bai tre',
  };
  return actionMap[action] || action;
};

const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'TODO': 'Cho xu ly',
    'IN_PROGRESS': 'Dang lam',
    'DONE': 'Hoan thanh',
    'VERIFIED': 'Da xac nhan',
  };
  return statusMap[status] || status;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatRole = (role: string): string => {
  return role === 'leader' ? 'Leader' : 'Thanh vien';
};

// Add UEH Header to page
const addUEHHeader = (doc: jsPDF, pageWidth: number, projectName: string, classCode?: string | null, instructorName?: string | null) => {
  // Draw UEH text logo
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...UEH_TEAL);
  doc.text('UEH', 14, 18);
  
  // Draw UNIVERSITY text
  doc.setFontSize(10);
  doc.setTextColor(...UEH_ORANGE);
  doc.text('UNIVERSITY', 14, 24);
  
  // Decorative line
  doc.setDrawColor(...UEH_TEAL);
  doc.setLineWidth(0.5);
  doc.line(14, 28, pageWidth - 14, 28);
  
  // Orange accent line
  doc.setDrawColor(...UEH_ORANGE);
  doc.setLineWidth(2);
  doc.line(14, 30, 50, 30);

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...UEH_TEAL);
  doc.text('BAO CAO MINH CHUNG DU AN', pageWidth / 2, 45, { align: 'center' });
  
  // Project name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(removeVietnameseDiacritics(projectName), pageWidth / 2, 55, { align: 'center' });
  
  // Info line
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const infoLine = [
    classCode ? `Lop: ${removeVietnameseDiacritics(classCode)}` : null,
    instructorName ? `GV HD: ${removeVietnameseDiacritics(instructorName)}` : null,
    `Ngay xuat: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
  ].filter(Boolean).join('   |   ');
  doc.text(infoLine, pageWidth / 2, 63, { align: 'center' });
};

// Add chapter heading
const addChapterHeading = (doc: jsPDF, title: string, yPos: number): number => {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...UEH_TEAL);
  doc.text(removeVietnameseDiacritics(title), 14, yPos);
  
  // Underline
  doc.setDrawColor(...UEH_ORANGE);
  doc.setLineWidth(0.8);
  doc.line(14, yPos + 2, 70, yPos + 2);
  
  return yPos + 10;
};

// Add section heading
const addSectionHeading = (doc: jsPDF, title: string, yPos: number): number => {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text(removeVietnameseDiacritics(title), 14, yPos);
  return yPos + 7;
};

// Add footer
const addFooter = (doc: jsPDF, pageWidth: number, pageHeight: number, pageNumber: number, totalPages: number) => {
  // Footer line
  doc.setDrawColor(...UEH_TEAL);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
  
  // UEH branding
  doc.setFontSize(8);
  doc.setTextColor(...UEH_TEAL);
  doc.setFont('helvetica', 'bold');
  doc.text('UEH', 14, pageHeight - 8);
  
  doc.setTextColor(...UEH_ORANGE);
  doc.setFontSize(6);
  doc.text('UNIVERSITY', 24, pageHeight - 8);
  
  // Page number
  doc.setTextColor(128, 128, 128);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Trang ${pageNumber} / ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  
  // Date
  doc.text(format(new Date(), 'dd/MM/yyyy'), pageWidth - 14, pageHeight - 8, { align: 'right' });
};

export const exportProjectEvidencePdf = (data: ExportData) => {
  const { project, members, stages, tasks, taskScores, stageScores, finalScores, resources, activityLogs, options } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // ============ COVER PAGE ============
  addUEHHeader(doc, pageWidth, project.name, project.class_code, project.instructor_name);
  
  let yPos = 75;
  
  // Chapter 1: General Info (always included)
  yPos = addChapterHeading(doc, 'CHUONG 1: THONG TIN CHUNG', yPos);
  
  // Project info box
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(...UEH_TEAL);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, yPos, pageWidth - 28, 55, 3, 3, 'FD');
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  const infoItems = [
    ['Ten du an:', removeVietnameseDiacritics(project.name)],
    ['Mo ta:', removeVietnameseDiacritics(project.description || 'Khong co mo ta')],
    ['Ma lop:', project.class_code || '-'],
    ['Giang vien huong dan:', removeVietnameseDiacritics(project.instructor_name || '-')],
    ['Email GV:', project.instructor_email || '-'],
    ['Link Zalo:', project.zalo_link ? 'Co' : 'Khong'],
  ];
  
  infoItems.forEach(([label, value], index) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPos + (index * 8));
    doc.setFont('helvetica', 'normal');
    const text = String(value).substring(0, 80);
    doc.text(text, 60, yPos + (index * 8));
  });
  
  yPos += 60;

  // ============ CHAPTER 2: MEMBERS ============
  if (options.includeMembers && members.length > 0) {
    doc.addPage();
    yPos = 25;
    yPos = addChapterHeading(doc, 'CHUONG 2: DANH SACH THANH VIEN', yPos);
    
    const memberData = members.map((m, index) => [
      (index + 1).toString(),
      m.profiles?.student_id || '-',
      removeVietnameseDiacritics(m.profiles?.full_name || '-'),
      formatRole(m.role),
      format(new Date(m.joined_at), 'dd/MM/yyyy'),
    ]);
    
    autoTable(doc, {
      head: [['STT', 'MSSV', 'Ho ten', 'Vai tro', 'Ngay tham gia']],
      body: memberData,
      startY: yPos,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: UEH_TEAL, textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 55 },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 35, halign: 'center' },
      },
      alternateRowStyles: { fillColor: UEH_TEAL_LIGHT },
    });
  }

  // ============ CHAPTER 3: PROGRESS ============
  if (options.includeTasks && tasks.length > 0) {
    doc.addPage();
    yPos = 25;
    yPos = addChapterHeading(doc, 'CHUONG 3: TIEN DO THUC HIEN', yPos);
    
    // Stats overview
    yPos = addSectionHeading(doc, '3.1 Thong ke tong quan', yPos);
    
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'DONE' || t.status === 'VERIFIED').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const todoTasks = tasks.filter(t => t.status === 'TODO').length;
    const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Tong so task: ${totalTasks}`, 20, yPos);
    doc.text(`Hoan thanh: ${doneTasks} (${progressPercent}%)`, 80, yPos);
    yPos += 6;
    doc.text(`Dang lam: ${inProgressTasks}`, 20, yPos);
    doc.text(`Cho xu ly: ${todoTasks}`, 80, yPos);
    yPos += 12;
    
    // Progress by stage
    yPos = addSectionHeading(doc, '3.2 Tien do theo giai doan', yPos);
    
    stages.forEach((stage, stageIndex) => {
      const stageTasks = tasks.filter(t => t.stage_id === stage.id);
      const stageCompleted = stageTasks.filter(t => t.status === 'DONE' || t.status === 'VERIFIED').length;
      const stageProgress = stageTasks.length > 0 ? Math.round((stageCompleted / stageTasks.length) * 100) : 0;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`3.2.${stageIndex + 1} ${removeVietnameseDiacritics(stage.name)} [${stageProgress}%]`, 20, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      stageTasks.forEach(task => {
        const assignees = task.task_assignments?.map(a => removeVietnameseDiacritics(a.profiles?.full_name || '')).join(', ') || '-';
        const deadline = task.deadline ? format(new Date(task.deadline), 'dd/MM/yyyy') : '-';
        doc.text(`  - ${removeVietnameseDiacritics(task.title.substring(0, 40))} | ${formatStatus(task.status)} | DL: ${deadline}`, 24, yPos);
        yPos += 5;
        
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 25;
        }
      });
      yPos += 4;
    });
    
    // Tasks without stage
    const unstagedTasks = tasks.filter(t => !t.stage_id);
    if (unstagedTasks.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Chua phan giai doan`, 20, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      unstagedTasks.forEach(task => {
        const deadline = task.deadline ? format(new Date(task.deadline), 'dd/MM/yyyy') : '-';
        doc.text(`  - ${removeVietnameseDiacritics(task.title.substring(0, 40))} | ${formatStatus(task.status)} | DL: ${deadline}`, 24, yPos);
        yPos += 5;
        
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 25;
        }
      });
    }
  }

  // ============ CHAPTER 4: TASK DETAILS ============
  if (options.includeTasks && tasks.length > 0) {
    doc.addPage();
    yPos = 25;
    yPos = addChapterHeading(doc, 'CHUONG 4: CHI TIET CONG VIEC', yPos);
    
    const taskData = tasks.map((t, index) => {
      const stageName = stages.find(s => s.id === t.stage_id)?.name || 'Chua phan';
      const assignees = t.task_assignments?.map(a => removeVietnameseDiacritics(a.profiles?.full_name?.split(' ').pop() || '')).join(', ') || '-';
      return [
        (index + 1).toString(),
        removeVietnameseDiacritics(t.title.substring(0, 25)),
        removeVietnameseDiacritics(stageName.substring(0, 15)),
        formatStatus(t.status),
        t.deadline ? format(new Date(t.deadline), 'dd/MM') : '-',
        assignees.substring(0, 20),
      ];
    });
    
    autoTable(doc, {
      head: [['STT', 'Task', 'Giai doan', 'Trang thai', 'Deadline', 'Nguoi thuc hien']],
      body: taskData,
      startY: yPos,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: UEH_TEAL, textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 40 },
      },
      alternateRowStyles: { fillColor: UEH_TEAL_LIGHT },
    });
  }

  // ============ CHAPTER 5: SCORES ============
  if (options.includeScores && members.length > 0) {
    doc.addPage();
    yPos = 25;
    yPos = addChapterHeading(doc, 'CHUONG 5: DIEM QUA TRINH', yPos);
    
    // Final scores table
    yPos = addSectionHeading(doc, '5.1 Bang diem tong ket', yPos);
    
    const scoreHeaders = ['STT', 'MSSV', 'Ho ten', ...stages.map((s, i) => `GD${i + 1}`), 'Tong ket'];
    
    const scoreData = members.map((m, index) => {
      const stageScoreValues = stages.map(stage => {
        const score = stageScores.find(ss => ss.stage_id === stage.id && ss.user_id === m.user_id);
        return score?.final_stage_score?.toFixed(1) || '-';
      });
      const finalScore = finalScores.find(fs => fs.user_id === m.user_id);
      
      return [
        (index + 1).toString(),
        m.profiles?.student_id || '-',
        removeVietnameseDiacritics(m.profiles?.full_name?.substring(0, 20) || '-'),
        ...stageScoreValues,
        finalScore?.final_score?.toFixed(1) || '-',
      ];
    });
    
    autoTable(doc, {
      head: [scoreHeaders],
      body: scoreData,
      startY: yPos,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: UEH_TEAL, textColor: 255, fontStyle: 'bold', halign: 'center' },
      alternateRowStyles: { fillColor: UEH_TEAL_LIGHT },
    });
  }

  // ============ CHAPTER 6: RESOURCES ============
  if (options.includeResources && resources.length > 0) {
    doc.addPage();
    yPos = 25;
    yPos = addChapterHeading(doc, 'CHUONG 6: TAI NGUYEN DU AN', yPos);
    
    const resourceData = resources.map((r, index) => [
      (index + 1).toString(),
      removeVietnameseDiacritics(r.name.substring(0, 35)),
      r.category || '-',
      formatFileSize(r.file_size),
      format(new Date(r.created_at), 'dd/MM/yyyy'),
    ]);
    
    autoTable(doc, {
      head: [['STT', 'Ten file', 'Danh muc', 'Kich thuoc', 'Ngay upload']],
      body: resourceData,
      startY: yPos,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: UEH_TEAL, textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 30, halign: 'center' },
      },
      alternateRowStyles: { fillColor: UEH_TEAL_LIGHT },
    });
  }

  // ============ CHAPTER 7: ACTIVITY LOGS ============
  if (options.includeLogs && activityLogs.length > 0) {
    doc.addPage();
    yPos = 25;
    yPos = addChapterHeading(doc, 'CHUONG 7: NHAT KY HOAT DONG', yPos);
    
    const logData = activityLogs.slice(0, 100).map((log, index) => [
      (index + 1).toString(),
      format(new Date(log.created_at), 'dd/MM/yyyy'),
      format(new Date(log.created_at), 'HH:mm'),
      removeVietnameseDiacritics(log.user_name.split('@')[0].substring(0, 15)),
      ACTION_TYPE_LABELS[log.action_type] || log.action_type,
      removeVietnameseDiacritics(formatAction(log.action)),
    ]);
    
    autoTable(doc, {
      head: [['STT', 'Ngay', 'Gio', 'Nguoi thuc hien', 'Loai', 'Hanh dong']],
      body: logData,
      startY: yPos,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: UEH_TEAL, textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 35 },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 50 },
      },
      alternateRowStyles: { fillColor: UEH_TEAL_LIGHT },
    });
    
    if (activityLogs.length > 100) {
      const lastY = (doc as any).lastAutoTable?.finalY || yPos + 20;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`... va ${activityLogs.length - 100} hoat dong khac`, 14, lastY + 8);
    }
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, pageWidth, pageHeight, i, totalPages);
  }

  // Save the PDF
  const slug = project.slug || project.short_id || 'project';
  const fileName = `minh-chung-${removeVietnameseDiacritics(slug).toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`;
  doc.save(fileName);
  
  return fileName;
};
