import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ActivityLog {
  id: string;
  action: string;
  action_type: string;
  description: string | null;
  user_name: string;
  created_at: string;
}

interface ExportOptions {
  projectName: string;
  logs: ActivityLog[];
  dateFrom?: Date;
  dateTo?: Date;
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

// Remove Vietnamese diacritics for PDF compatibility
const removeVietnameseDiacritics = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

export const exportActivityLogToPdf = ({ projectName, logs, dateFrom, dateTo }: ExportOptions) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const title = removeVietnameseDiacritics(`Nhat ky hoat dong - ${projectName}`);
  doc.text(title, pageWidth / 2, 20, { align: 'center' });
  
  // Date range info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let dateRangeText = 'Tat ca thoi gian';
  if (dateFrom && dateTo) {
    dateRangeText = `Tu ${format(dateFrom, 'dd/MM/yyyy')} den ${format(dateTo, 'dd/MM/yyyy')}`;
  } else if (dateFrom) {
    dateRangeText = `Tu ${format(dateFrom, 'dd/MM/yyyy')}`;
  } else if (dateTo) {
    dateRangeText = `Den ${format(dateTo, 'dd/MM/yyyy')}`;
  }
  doc.text(dateRangeText, pageWidth / 2, 28, { align: 'center' });
  
  // Export timestamp
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(`Xuat luc: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`, pageWidth / 2, 34, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  // Summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Tong so hoat dong: ${logs.length}`, 14, 44);
  
  // Table data
  const tableData = logs.map((log, index) => [
    (index + 1).toString(),
    format(new Date(log.created_at), 'dd/MM/yyyy'),
    format(new Date(log.created_at), 'HH:mm:ss'),
    removeVietnameseDiacritics(log.user_name.split('@')[0]),
    ACTION_TYPE_LABELS[log.action_type] || log.action_type,
    removeVietnameseDiacritics(formatAction(log.action)),
    removeVietnameseDiacritics(log.description || '-'),
  ]);
  
  // Generate table
  autoTable(doc, {
    head: [['STT', 'Ngay', 'Gio', 'Nguoi thuc hien', 'Loai', 'Hanh dong', 'Mo ta']],
    body: tableData,
    startY: 50,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 18 },
      3: { cellWidth: 30 },
      4: { cellWidth: 22 },
      5: { cellWidth: 30 },
      6: { cellWidth: 'auto' },
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    didDrawPage: (data) => {
      // Footer with page number
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Trang ${data.pageNumber} / ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });
  
  // Save the PDF
  const fileName = `nhat-ky-hoat-dong-${removeVietnameseDiacritics(projectName).toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`;
  doc.save(fileName);
};
