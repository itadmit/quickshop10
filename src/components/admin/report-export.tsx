'use client';

import { useCallback } from 'react';

interface ExportSection {
  title: string;
  columns: { key: string; label: string }[];
  data: Record<string, unknown>[];
}

interface ReportExportProps {
  sections: ExportSection[];
  filename: string;
  reportTitle: string;
  period?: string;
}

export function ReportExport({ sections, filename, reportTitle, period }: ReportExportProps) {
  const handleExport = useCallback(() => {
    const lines: string[] = [];
    
    // Report header
    lines.push(`${reportTitle}`);
    if (period) {
      lines.push(`תקופה: ${period}`);
    }
    lines.push(`תאריך הפקה: ${new Date().toLocaleDateString('he-IL')}`);
    lines.push('');
    
    // Each section
    sections.forEach(section => {
      lines.push(section.title);
      lines.push(section.columns.map(c => c.label).join(','));
      
      section.data.forEach(row => {
        const values = section.columns.map(col => {
          const value = row[col.key];
          const strValue = String(value ?? '');
          // Escape for CSV
          if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        });
        lines.push(values.join(','));
      });
      
      lines.push(''); // Empty line between sections
    });
    
    const csv = `\uFEFF${lines.join('\n')}`; // BOM for Hebrew
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [sections, filename, reportTitle, period]);

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      ייצוא דוח
    </button>
  );
}

