'use client';

import { useState } from 'react';
import { Trash2, Mail, CheckCircle2 } from 'lucide-react';
import { deleteWaitlistEntry } from './actions';
import Link from 'next/link';

interface WaitlistEntry {
  id: string;
  email: string;
  firstName: string | null;
  phone: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  variant: {
    id: string;
    title: string;
  } | null;
  isNotified: boolean;
  notifiedAt: Date | null;
  createdAt: Date;
}

interface WaitlistDataTableProps {
  entries: WaitlistEntry[];
  storeSlug: string;
  basePath: string;
}

export function WaitlistDataTable({ entries, storeSlug, basePath }: WaitlistDataTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) return;

    setDeletingId(id);
    try {
      const result = await deleteWaitlistEntry(id, storeSlug);
      if (!result.success) {
        alert(result.error || 'שגיאה במחיקה');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          אין רשומות ברשימת ההמתנה
        </h3>
        <p className="text-gray-500">
          לקוחות שירשמו להתעדכן על מוצרים שאזל מלאיים יופיעו כאן
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                אימייל
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                שם
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                טלפון
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                מוצר
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                וריאציה
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                סטטוס
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                תאריך הרשמה
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a 
                      href={`mailto:${entry.email}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {entry.email}
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.firstName || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`${basePath}/admin/products/${entry.product.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {entry.product.name}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {entry.variant ? entry.variant.title : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {entry.isNotified ? (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">נשלח</span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      ממתין
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex flex-col">
                    <span>{formatDate(entry.createdAt)}</span>
                    {entry.notifiedAt && (
                      <span className="text-xs text-gray-400">
                        עודכן: {formatDate(entry.notifiedAt)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      title="מחק"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


