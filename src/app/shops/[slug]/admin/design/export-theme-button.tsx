'use client';

interface ExportThemeButtonProps {
  templateId: string;
  template: {
    id: string;
    name: string;
    description: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
  } | undefined;
  storeSlug: string;
}

export function ExportThemeButton({ templateId, template, storeSlug }: ExportThemeButtonProps) {
  const handleExport = () => {
    if (!template) return;
    
    const themeData = {
      templateId,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        colors: template.colors,
        fonts: template.fonts,
      },
      storeSlug,
      exportDate: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(themeData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `theme-${storeSlug}-${templateId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button 
      onClick={handleExport}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      title="ייצא קובץ JSON"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
    </button>
  );
}


