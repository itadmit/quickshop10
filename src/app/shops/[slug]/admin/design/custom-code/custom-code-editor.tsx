'use client';

import { useState, useTransition } from 'react';
import { updateCustomCode } from './actions';

interface CustomCodeEditorProps {
  storeId: string;
  storeSlug: string;
  initialCode: {
    headCode: string;
    bodyStartCode: string;
    bodyEndCode: string;
    customCss: string;
  };
}

type TabType = 'head' | 'bodyStart' | 'bodyEnd' | 'css';

const tabs: { id: TabType; label: string; description: string }[] = [
  { id: 'head', label: '<head>', description: 'קוד שמתווסף לתוך <head> (מטא, סקריפטים, פונטים)' },
  { id: 'bodyStart', label: '<body> התחלה', description: 'קוד שמתווסף אחרי פתיחת <body>' },
  { id: 'bodyEnd', label: '<body> סוף', description: 'קוד שמתווסף לפני סגירת </body> (סקריפטים, טראקינג)' },
  { id: 'css', label: 'CSS', description: 'סטיילים מותאמים אישית' },
];

export function CustomCodeEditor({ storeId, storeSlug, initialCode }: CustomCodeEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('head');
  const [code, setCode] = useState(initialCode);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      await updateCustomCode(storeId, storeSlug, {
        customHeadCode: code.headCode,
        customBodyStartCode: code.bodyStartCode,
        customBodyEndCode: code.bodyEndCode,
        customCss: code.customCss,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const getCurrentCode = () => {
    switch (activeTab) {
      case 'head': return code.headCode;
      case 'bodyStart': return code.bodyStartCode;
      case 'bodyEnd': return code.bodyEndCode;
      case 'css': return code.customCss;
    }
  };

  const setCurrentCode = (value: string) => {
    switch (activeTab) {
      case 'head': setCode({ ...code, headCode: value }); break;
      case 'bodyStart': setCode({ ...code, bodyStartCode: value }); break;
      case 'bodyEnd': setCode({ ...code, bodyEndCode: value }); break;
      case 'css': setCode({ ...code, customCss: value }); break;
    }
  };

  const activeTabInfo = tabs.find(t => t.id === activeTab);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="bg-[#2d2d30] flex items-center border-b border-[#3c3c3c]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-[#1e1e1e] text-white border-t-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-[#3c3c3c]'
            }`}
          >
            {tab.label}
          </button>
        ))}
        
        {/* Save Button */}
        <div className="mr-auto px-4">
          <button
            onClick={handleSave}
            disabled={isPending}
            className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } disabled:opacity-50`}
          >
            {isPending ? 'שומר...' : saved ? 'נשמר ✓' : 'שמור שינויים'}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="bg-[#252526] px-4 py-2 text-xs text-gray-400 border-b border-[#3c3c3c]">
        {activeTabInfo?.description}
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden">
        <textarea
          value={getCurrentCode()}
          onChange={(e) => setCurrentCode(e.target.value)}
          placeholder={activeTab === 'css' ? '/* הוסף CSS מותאם אישית */' : '<!-- הוסף קוד HTML כאן -->'}
          className="w-full h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none"
          style={{ 
            tabSize: 2,
            lineHeight: '1.5',
          }}
          dir="ltr"
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="bg-[#007acc] px-4 py-1 text-xs text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>{activeTab === 'css' ? 'CSS' : 'HTML'}</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-4">
          <span>שורות: {getCurrentCode().split('\n').length}</span>
        </div>
      </div>
    </div>
  );
}
