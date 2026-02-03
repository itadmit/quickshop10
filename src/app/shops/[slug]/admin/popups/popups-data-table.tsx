'use client';

import { useState, useTransition } from 'react';
import { deletePopup, togglePopupStatus, duplicatePopup } from './actions';
import { PopupForm } from './popup-form';
import type { Popup } from '@/lib/db/schema';

interface PopupsDataTableProps {
  popups: Popup[];
  storeId: string;
}

const typeLabels: Record<string, string> = {
  image: 'תמונה',
  text: 'טקסט',
  form: 'טופס',
};

const triggerLabels: Record<string, string> = {
  on_load: 'בטעינת דף',
  exit_intent: 'יציאה',
  scroll: 'גלילה',
  time_delay: 'זמן',
};

export function PopupsDataTable({ popups, storeId }: PopupsDataTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סוג</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">טריגר</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">צפיות</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">המרות</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {popups.map((popup) => (
              <PopupRow key={popup.id} popup={popup} storeId={storeId} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PopupRow({ popup, storeId }: { popup: Popup; storeId: string }) {
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const conversionRate = popup.impressions > 0 
    ? ((popup.conversions / popup.impressions) * 100).toFixed(1) 
    : '0';

  const handleToggle = () => {
    startTransition(async () => {
      await togglePopupStatus(popup.id, storeId, !popup.isActive);
    });
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      await duplicatePopup(popup.id, storeId);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deletePopup(popup.id, storeId);
      setShowDeleteConfirm(false);
    });
  };

  return (
    <>
      <tr className={`hover:bg-gray-50 ${isPending ? 'opacity-50' : ''}`}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">{popup.name}</div>
          <div className="text-xs text-gray-500">
            {popup.targetPages === 'all' ? 'כל העמודים' : 
             popup.targetPages === 'homepage' ? 'דף הבית' :
             popup.targetPages === 'products' ? 'מוצרים' :
             popup.targetPages === 'categories' ? 'קטגוריות' : 'מותאם אישית'}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
            {typeLabels[popup.type]}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{triggerLabels[popup.trigger]}</div>
          {(popup.trigger === 'time_delay' || popup.trigger === 'scroll') && (
            <div className="text-xs text-gray-500">
              {popup.trigger === 'time_delay' ? `${popup.triggerValue} שניות` : `${popup.triggerValue}%`}
            </div>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {popup.impressions.toLocaleString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">{popup.conversions.toLocaleString()}</div>
          <div className="text-xs text-gray-500">{conversionRate}%</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
              popup.isActive ? 'bg-green-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200 ${
                popup.isActive ? 'translate-x-[22px] rtl:-translate-x-[2px]' : 'translate-x-[2px] rtl:-translate-x-[22px]'
              }`}
            />
          </button>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-1">
            <PopupForm storeId={storeId} mode="edit" popup={popup} />
            <button
              onClick={handleDuplicate}
              disabled={isPending}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="שכפל"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="מחק"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </td>
      </tr>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <tr>
          <td colSpan={7} className="p-0">
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteConfirm(false)}>
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()} dir="rtl">
                <h3 className="text-lg font-bold text-gray-900 mb-2">מחיקת פופאפ</h3>
                <p className="text-gray-600 mb-6">
                  האם למחוק את הפופאפ &quot;{popup.name}&quot;? פעולה זו לא ניתנת לביטול.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {isPending ? 'מוחק...' : 'מחק'}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}











