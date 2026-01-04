'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronLeft, Search, X, Folder, FolderOpen, Check } from 'lucide-react';

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
  value: string | null;
  onChange: (categoryId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
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
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-gray-900 text-white' 
            : 'hover:bg-gray-100 text-gray-700'
        }`}
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
            className={`p-0.5 rounded hover:bg-gray-200/50 transition-colors ${
              isSelected ? 'hover:bg-white/20' : ''
            }`}
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

        {/* Folder icon */}
        {hasChildren && isExpanded ? (
          <FolderOpen className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
        ) : (
          <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
        )}

        {/* Name */}
        <span className="text-sm truncate flex-1">
          {highlightMatch(node.name)}
        </span>

        {/* Children count */}
        {hasChildren && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
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

export function CategoryPicker({
  categories,
  value,
  onChange,
  placeholder = 'בחר קטגוריה',
  disabled = false,
  className = '',
}: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Build tree structure
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  // Filter tree by search
  const filteredTree = useMemo(() => filterCategories(tree, search), [tree, search]);

  // Get selected category name/path
  const selectedPath = useMemo(() => {
    if (!value) return null;
    return getCategoryPath(categories, value);
  }, [categories, value]);

  // Auto-expand parents of selected item
  useEffect(() => {
    if (value) {
      const map = new Map<string, CategoryNode>();
      categories.forEach(cat => map.set(cat.id, cat));
      
      const newExpanded = new Set(expandedIds);
      let current = map.get(value);
      while (current?.parentId) {
        newExpanded.add(current.parentId);
        current = map.get(current.parentId);
      }
      setExpandedIds(newExpanded);
    }
  }, [value, categories]);

  // Expand all when searching
  useEffect(() => {
    if (search.trim()) {
      const allIds = new Set(categories.map(c => c.id));
      setExpandedIds(allIds);
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

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setIsOpen(false);
    setSearch('');
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
    onChange(null);
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
        <span className={`text-sm truncate ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedPath || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
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

          {/* Tree */}
          <div className="max-h-64 overflow-y-auto p-1">
            {/* No category option */}
            <div
              className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
                !value 
                  ? 'bg-gray-900 text-white' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
              onClick={() => handleSelect('')}
            >
              <span className="w-5" />
              <span className="text-sm">ללא קטגוריה</span>
            </div>

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
                  selectedId={value}
                  expandedIds={expandedIds}
                  onSelect={handleSelect}
                  onToggle={handleToggle}
                  searchQuery={search}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {categories.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400">
                {categories.length} קטגוריות
              </p>
            </div>
          )}
        </div>
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
          <FolderOpen className="w-4 h-4 shrink-0 text-amber-500" />
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
          <FolderOpen className="w-4 h-4 shrink-0 text-amber-500" />
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

