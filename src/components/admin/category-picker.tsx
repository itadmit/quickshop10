'use client';

import { useState, useRef, useEffect, useMemo, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronLeft, Search, X, Folder, FolderOpen, Check, Plus, Loader2 } from 'lucide-react';

// ============================================
// CategoryPicker - Hierarchical Category Selector
// Shopify-style tree picker with search
// Client Component (minimal JS for interaction)
// ============================================

export interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: CategoryNode[];
}

interface CategoryPickerProps {
  categories: CategoryNode[];
  value: string[];
  onChange: (categoryIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  storeId?: string;
  onCategoryCreated?: (newCategory: CategoryNode) => void;
}

// Quick create category form component
function QuickCreateForm({
  categories,
  storeId,
  onCreated,
  onCancel,
}: {
  categories: CategoryNode[];
  storeId: string;
  onCreated: (newCategory: CategoryNode) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    e?.stopPropagation(); // Prevent bubbling to parent form
    
    if (!name.trim()) {
      setError('שם הקטגוריה הוא שדה חובה');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/shops/${storeId}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            parentId: parentId || null,
          }),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          setError(result.error || 'אירעה שגיאה ביצירת הקטגוריה');
          return;
        }

        // Success - pass new category to parent
        onCreated({
          id: result.id,
          name: name.trim(),
          parentId: parentId || null,
        });
      } catch {
        setError('אירעה שגיאה ביצירת הקטגוריה');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(e);
    }
  };

  return (
    // Use div instead of form to prevent nested form issues (parent ProductForm)
    <div className="p-3 border-t border-gray-100 bg-gray-50">
      <div className="space-y-3">
        <div>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="שם הקטגוריה"
            disabled={isPending}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 disabled:opacity-50"
          />
        </div>
        
        <div>
          <select
            value={parentId || ''}
            onChange={(e) => setParentId(e.target.value || null)}
            disabled={isPending}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400 disabled:opacity-50 bg-white"
          >
            <option value="">קטגוריה ראשית</option>
            {categories
              .filter(c => !c.parentId) // Only show root categories as parents
              .map(cat => (
                <option key={cat.id} value={cat.id}>
                  תת-קטגוריה של: {cat.name}
                </option>
              ))}
          </select>
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !name.trim()}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                יוצר...
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" />
                צור קטגוריה
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}

// Build tree structure from flat list
function buildCategoryTree(categories: CategoryNode[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  // First pass: create nodes
  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build tree
  categories.forEach(cat => {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// Get category path (breadcrumb)
function getCategoryPath(categories: CategoryNode[], categoryId: string): string {
  const map = new Map<string, CategoryNode>();
  categories.forEach(cat => map.set(cat.id, cat));

  const path: string[] = [];
  let current = map.get(categoryId);
  
  while (current) {
    path.unshift(current.name);
    current = current.parentId ? map.get(current.parentId) : undefined;
  }

  return path.join(' / ');
}

// Filter categories by search
function filterCategories(tree: CategoryNode[], search: string): CategoryNode[] {
  if (!search.trim()) return tree;
  
  const searchLower = search.toLowerCase();
  
  function filterNode(node: CategoryNode): CategoryNode | null {
    const matches = node.name.toLowerCase().includes(searchLower);
    const filteredChildren = node.children
      ?.map(child => filterNode(child))
      .filter(Boolean) as CategoryNode[] | undefined;
    
    if (matches || (filteredChildren && filteredChildren.length > 0)) {
      return {
        ...node,
        children: filteredChildren || [],
      };
    }
    return null;
  }

  return tree.map(node => filterNode(node)).filter(Boolean) as CategoryNode[];
}

// Tree Node Component
function TreeNode({
  node,
  level,
  selectedIds,
  expandedIds,
  onSelect,
  onToggle,
  searchQuery,
}: {
  node: CategoryNode;
  level: number;
  selectedIds: string[];
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  searchQuery: string;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedIds.includes(node.id);

  // Highlight search match
  const highlightMatch = (text: string) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark>
      ) : part
    );
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2.5 py-2 px-2 rounded-md cursor-pointer transition-colors hover:bg-gray-100 text-gray-700`}
        style={{ paddingRight: `${8 + level * 16}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="p-0.5 rounded hover:bg-gray-200 transition-colors text-gray-500"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Checkbox */}
        <div className={`w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
          isSelected 
            ? 'bg-gray-900 border-gray-900' 
            : 'border-gray-300 bg-white'
        }`}>
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>

        {/* Folder icon */}
        {hasChildren && isExpanded ? (
          <FolderOpen className="w-4 h-4 shrink-0 text-gray-400" />
        ) : (
          <Folder className="w-4 h-4 shrink-0 text-gray-400" />
        )}

        {/* Name */}
        <span className={`text-sm truncate flex-1 ${isSelected ? 'font-medium text-gray-900' : ''}`}>
          {highlightMatch(node.name)}
        </span>

        {/* Children count */}
        {hasChildren && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {node.children!.length}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryPicker({
  categories,
  value,
  onChange,
  placeholder = 'בחר קטגוריה',
  disabled = false,
  className = '',
  storeId,
  onCategoryCreated,
}: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);
  const router = useRouter();

  // Update local categories when props change
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // For SSR - only render portal after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dropdown position - open upward if not enough space below
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownMaxHeight = 340;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      
      // Open upward if not enough space below and more space above
      const openUpward = spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow;
      
      setDropdownPosition({
        top: openUpward 
          ? Math.max(8, rect.top - Math.min(dropdownMaxHeight, spaceAbove))  // Open upward
          : rect.bottom + 4,  // Open downward
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  // Build tree structure
  const tree = useMemo(() => buildCategoryTree(localCategories), [localCategories]);

  // Filter tree by search
  const filteredTree = useMemo(() => filterCategories(tree, search), [tree, search]);

  // Get selected categories display text
  const selectedDisplay = useMemo(() => {
    if (!value || value.length === 0) return null;
    if (value.length === 1) {
      return getCategoryPath(localCategories, value[0]);
    }
    // Show first category + count
    const firstName = localCategories.find(c => c.id === value[0])?.name || '';
    return `${firstName} +${value.length - 1}`;
  }, [localCategories, value]);

  // Auto-expand parents of selected items
  useEffect(() => {
    if (value && value.length > 0) {
      const map = new Map<string, CategoryNode>();
      localCategories.forEach(cat => map.set(cat.id, cat));
      
      const newExpanded = new Set(expandedIds);
      value.forEach(id => {
        let current = map.get(id);
        while (current?.parentId) {
          newExpanded.add(current.parentId);
          current = map.get(current.parentId);
        }
      });
      setExpandedIds(newExpanded);
    }
  }, [value, localCategories]);

  // Expand all when searching
  useEffect(() => {
    if (search.trim()) {
      const allIds = new Set(localCategories.map(c => c.id));
      setExpandedIds(allIds);
    }
  }, [search, localCategories]);

  // Handle new category created
  const handleCategoryCreated = (newCategory: CategoryNode) => {
    // Add to local categories
    setLocalCategories(prev => [...prev, newCategory]);
    // Auto-select the new category
    onChange([...value, newCategory.id]);
    // Close quick create form
    setShowQuickCreate(false);
    // Notify parent if callback provided
    onCategoryCreated?.(newCategory);
    // Expand parent if it's a subcategory
    if (newCategory.parentId) {
      setExpandedIds(prev => new Set([...prev, newCategory.parentId!]));
    }
    // Refresh server data to sync categories
    router.refresh();
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideTrigger = containerRef.current && !containerRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      
      if (isOutsideTrigger && isOutsideDropdown) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSelect = (categoryId: string) => {
    // Toggle selection - add or remove
    const isSelected = value.includes(categoryId);
    if (isSelected) {
      onChange(value.filter(id => id !== categoryId));
    } else {
      onChange([...value, categoryId]);
    }
    // Don't close - allow multiple selection
  };

  const handleToggle = (categoryId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-lg transition-colors text-right ${
          disabled
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400'
            : isOpen
            ? 'border-gray-400 ring-2 ring-gray-900/10'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className={`text-sm truncate ${value.length > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedDisplay || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value.length > 0 && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown - rendered via Portal to escape overflow:hidden containers */}
      {isOpen && mounted && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden flex flex-col"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: '340px',
            zIndex: 9999,
          }}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש קטגוריה..."
                className="w-full pr-8 pl-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Tree */}
          <div className="max-h-64 overflow-y-auto p-1">
            {/* Categories tree */}
            {filteredTree.length === 0 && search ? (
              <div className="py-8 text-center text-sm text-gray-400">
                לא נמצאו קטגוריות
              </div>
            ) : (
              filteredTree.map(node => (
                <TreeNode
                  key={node.id}
                  node={node}
                  level={0}
                  selectedIds={value}
                  expandedIds={expandedIds}
                  onSelect={handleSelect}
                  onToggle={handleToggle}
                  searchQuery={search}
                />
              ))
            )}
          </div>

          {/* Quick Create Form */}
          {showQuickCreate && storeId && (
            <QuickCreateForm
              categories={localCategories}
              storeId={storeId}
              onCreated={handleCategoryCreated}
              onCancel={() => setShowQuickCreate(false)}
            />
          )}

          {/* Footer */}
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {storeId && !showQuickCreate && (
                <button
                  type="button"
                  onClick={() => setShowQuickCreate(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  הוסף קטגוריה
                </button>
              )}
              <span className="text-xs text-gray-400">
                {value.length > 0 ? `${value.length} נבחרו` : `${localCategories.length} קטגוריות`}
              </span>
            </div>
            {value.length > 0 && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs bg-gray-900 text-white px-3 py-1 rounded-md hover:bg-gray-800"
              >
                סיום
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ============================================
// Inline Category Picker for Tables
// Simpler version for use in table cells
// ============================================

interface InlineCategoryPickerProps {
  categories: CategoryNode[];
  value: string | null;
  onChange: (categoryId: string | null) => Promise<void>;
  displayValue?: string | null;
}

export function InlineCategoryPicker({
  categories,
  value,
  onChange,
  displayValue,
}: InlineCategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Build tree structure
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);
  const filteredTree = useMemo(() => filterCategories(tree, search), [tree, search]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Expand all when searching
  useEffect(() => {
    if (search.trim()) {
      setExpandedIds(new Set(categories.map(c => c.id)));
    }
  }, [search, categories]);

  const handleSelect = async (categoryId: string | null) => {
    setIsPending(true);
    try {
      await onChange(categoryId);
      setIsOpen(false);
      setSearch('');
    } finally {
      setIsPending(false);
    }
  };

  const handleToggle = (categoryId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`w-full text-right px-2 py-1 rounded hover:bg-gray-100 transition-colors cursor-pointer text-sm ${
          isPending ? 'opacity-50' : ''
        }`}
      >
        {displayValue || '-'}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש..."
                className="w-full pr-8 pl-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
                autoFocus
              />
            </div>
          </div>

          {/* Tree */}
          <div className="max-h-48 overflow-y-auto p-1">
            {/* No category */}
            <div
              className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                !value ? 'bg-gray-100' : 'hover:bg-gray-100'
              }`}
              onClick={() => handleSelect(null)}
            >
              <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                !value ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
              }`}>
                {!value && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-gray-500">ללא קטגוריה</span>
            </div>

            {filteredTree.map(node => (
              <InlineTreeNode
                key={node.id}
                node={node}
                level={0}
                selectedId={value}
                expandedIds={expandedIds}
                onSelect={(id) => handleSelect(id)}
                onToggle={handleToggle}
                searchQuery={search}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Tree Node for Inline picker (with checkbox style)
function InlineTreeNode({
  node,
  level,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  searchQuery,
}: {
  node: CategoryNode;
  level: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  searchQuery: string;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
          isSelected ? 'bg-gray-100' : 'hover:bg-gray-100'
        }`}
        style={{ paddingRight: `${8 + level * 16}px` }}
        onClick={() => onSelect(node.id)}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="p-0.5 rounded hover:bg-gray-200 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Checkbox */}
        <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
          isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
        }`}>
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>

        {/* Folder icon */}
        {hasChildren && isExpanded ? (
          <FolderOpen className="w-4 h-4 shrink-0 text-gray-400" />
        ) : (
          <Folder className="w-4 h-4 shrink-0 text-gray-400" />
        )}

        {/* Name */}
        <span className="text-sm truncate flex-1 text-gray-700">
          {node.name}
        </span>

        {/* Children count */}
        {hasChildren && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {node.children!.length}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map(child => (
            <InlineTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Multi-Select Category Picker with Checkboxes
// For selecting multiple categories
// ============================================

interface MultiCategoryPickerProps {
  categories: CategoryNode[];
  value: string[];
  onChange: (categoryIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Multi-select Tree Node with checkbox
function MultiTreeNode({
  node,
  level,
  selectedIds,
  expandedIds,
  onToggleSelect,
  onToggleExpand,
  searchQuery,
}: {
  node: CategoryNode;
  level: number;
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  searchQuery: string;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedIds.has(node.id);

  // Highlight search match
  const highlightMatch = (text: string) => {
    if (!searchQuery.trim()) return text;
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark>
      ) : part
    );
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-100 transition-colors"
        style={{ paddingRight: `${8 + level * 16}px` }}
      >
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className="p-0.5 rounded hover:bg-gray-200 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggleSelect(node.id)}
          className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
            isSelected 
              ? 'bg-gray-900 border-gray-900' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* Folder icon */}
        {hasChildren && isExpanded ? (
          <FolderOpen className="w-4 h-4 shrink-0 text-gray-400" />
        ) : (
          <Folder className="w-4 h-4 shrink-0 text-gray-400" />
        )}

        {/* Name - clicking also toggles selection */}
        <button
          type="button"
          onClick={() => onToggleSelect(node.id)}
          className="text-sm truncate flex-1 text-right text-gray-700 hover:text-gray-900"
        >
          {highlightMatch(node.name)}
        </button>

        {/* Children count */}
        {hasChildren && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {node.children!.length}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map(child => (
            <MultiTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggleSelect={onToggleSelect}
              onToggleExpand={onToggleExpand}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MultiCategoryPicker({
  categories,
  value,
  onChange,
  placeholder = 'בחר קטגוריות',
  disabled = false,
  className = '',
}: MultiCategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Selected IDs as Set for O(1) lookup
  const selectedIds = useMemo(() => new Set(value), [value]);

  // Build tree structure
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  // Filter tree by search
  const filteredTree = useMemo(() => filterCategories(tree, search), [tree, search]);

  // Get display text
  const displayText = useMemo(() => {
    if (value.length === 0) return null;
    if (value.length === 1) {
      return getCategoryPath(categories, value[0]);
    }
    return `${value.length} קטגוריות נבחרו`;
  }, [categories, value]);

  // Auto-expand parents of selected items
  useEffect(() => {
    if (value.length > 0) {
      const map = new Map<string, CategoryNode>();
      categories.forEach(cat => map.set(cat.id, cat));
      
      const newExpanded = new Set(expandedIds);
      value.forEach(id => {
        let current = map.get(id);
        while (current?.parentId) {
          newExpanded.add(current.parentId);
          current = map.get(current.parentId);
        }
      });
      setExpandedIds(newExpanded);
    }
  }, [value, categories]);

  // Expand all when searching
  useEffect(() => {
    if (search.trim()) {
      setExpandedIds(new Set(categories.map(c => c.id)));
    }
  }, [search, categories]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleToggleSelect = (categoryId: string) => {
    const newValue = selectedIds.has(categoryId)
      ? value.filter(id => id !== categoryId)
      : [...value, categoryId];
    onChange(newValue);
  };

  const handleToggleExpand = (categoryId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const handleSelectAll = () => {
    // Select all visible categories (in filtered tree)
    const getAllIds = (nodes: CategoryNode[]): string[] => {
      return nodes.flatMap(node => [node.id, ...(node.children ? getAllIds(node.children) : [])]);
    };
    const allIds = getAllIds(filteredTree);
    onChange(allIds);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-lg transition-colors text-right ${
          disabled
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400'
            : isOpen
            ? 'border-gray-400 ring-2 ring-gray-900/10'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className={`text-sm truncate ${value.length > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
          {displayText || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full right-0 left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש קטגוריה..."
                className="w-full pr-8 pl-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                בחר הכל
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                נקה הכל
              </button>
            </div>
            <span className="text-xs text-gray-400">
              {value.length} נבחרו
            </span>
          </div>

          {/* Tree */}
          <div className="max-h-64 overflow-y-auto p-1">
            {filteredTree.length === 0 && search ? (
              <div className="py-8 text-center text-sm text-gray-400">
                לא נמצאו קטגוריות
              </div>
            ) : filteredTree.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                אין קטגוריות
              </div>
            ) : (
              filteredTree.map(node => (
                <MultiTreeNode
                  key={node.id}
                  node={node}
                  level={0}
                  selectedIds={selectedIds}
                  expandedIds={expandedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleExpand={handleToggleExpand}
                  searchQuery={search}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {categories.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {categories.length} קטגוריות
              </p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-600 hover:text-gray-900 font-medium"
              >
                סיום
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

