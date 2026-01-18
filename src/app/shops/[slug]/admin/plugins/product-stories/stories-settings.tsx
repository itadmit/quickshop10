'use client';

/**
 * Stories Settings - Client Component
 * 
 * 🎨 ניהול סטוריז עם Drag & Drop
 */

import { useState, useTransition, useEffect } from 'react';
import {
  Settings, Eye, Heart, MessageCircle, Plus, Trash2,
  Search, X, Loader2, GripVertical, Image as ImageIcon, Video, Pencil
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateStoriesConfig, addProductToStories, removeStory, reorderStories, searchProducts, updateStoryMedia } from './actions';

interface Story {
  id: string;
  productId: string;
  position: number;
  isActive: boolean;
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  productTitle: string;
  productHandle: string;
  productPrice: number;
  productImage: string | null;
  customMediaUrl: string | null;
  customMediaType: 'image' | 'video' | null;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  price: number;
  image: string | null;
}

interface StoriesSettingsProps {
  storeId: string;
  storeSlug: string;
  initialConfig: Record<string, unknown>;
  initialStories: Story[];
}

// Sortable Story Item
function SortableStoryItem({
  story,
  onRemove,
  onEditMedia,
  isRemoving,
}: {
  story: Story;
  onRemove: (id: string) => void;
  onEditMedia: (story: Story) => void;
  isRemoving: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: story.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Determine which image to display (custom media or product image)
  const displayImage = story.customMediaUrl || story.productImage;
  const hasCustomMedia = !!story.customMediaUrl;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-4 p-4 bg-white border rounded-xl
        ${isDragging ? 'shadow-lg border-pink-300' : 'border-gray-200'}
      `}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Story Circle Preview - Click to edit media */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onEditMedia(story);
        }}
        className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-pink-500 p-0.5 group hover:border-pink-600 transition-colors"
        title="לחץ לשינוי תמונה/סרטון"
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 relative">
          {story.customMediaType === 'video' && story.customMediaUrl ? (
            <video
              src={story.customMediaUrl}
              muted
              className="w-full h-full object-cover"
            />
          ) : displayImage ? (
            <img
              src={displayImage}
              alt={story.productTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon className="w-6 h-6" />
            </div>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
        </div>
        {/* Custom media badge */}
        {hasCustomMedia && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-[8px]">✓</span>
          </div>
        )}
      </button>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{story.productTitle}</h4>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {story.viewsCount}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {story.likesCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {story.commentsCount}
          </span>
          {hasCustomMedia && (
            <span className="text-purple-500 text-xs flex items-center gap-1">
              {story.customMediaType === 'video' ? (
                <><Video className="w-3 h-3" /> סרטון</>
              ) : (
                <><ImageIcon className="w-3 h-3" /> תמונה מותאמת</>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <span className="text-sm font-medium text-gray-900">
        ₪{story.productPrice.toFixed(2)}
      </span>

      {/* Edit Media Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onEditMedia(story);
        }}
        className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
        title="ערוך תמונה/סרטון"
      >
        <ImageIcon className="w-5 h-5" />
      </button>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRemove(story.id);
        }}
        disabled={isRemoving}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
      >
        {isRemoving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Trash2 className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}

export function StoriesSettings({
  storeId,
  storeSlug,
  initialConfig,
  initialStories,
}: StoriesSettingsProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'stories'>('settings');
  const [config, setConfig] = useState(initialConfig);
  const [stories, setStories] = useState(initialStories);
  const [isSaving, startSaveTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  
  // Product Picker
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  
  // Media Editor
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isSavingMedia, setIsSavingMedia] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Search products
  useEffect(() => {
    if (!showProductPicker) return;
    
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchProducts(storeId, searchQuery);
      // Filter out products already in stories
      const storyProductIds = new Set(stories.map(s => s.productId));
      setSearchResults(results.filter(p => !storyProductIds.has(p.id)));
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, showProductPicker, storeId, stories]);

  // Save config
  const handleSaveConfig = async () => {
    startSaveTransition(async () => {
      await updateStoriesConfig(storeId, config);
    });
  };

  // Add product to stories
  const handleAddProduct = async (productId: string) => {
    setIsAdding(productId);
    const result = await addProductToStories(storeId, productId);
    
    if (result.success && result.story) {
      setStories(prev => [...prev, result.story as Story]);
      setSearchResults(prev => prev.filter(p => p.id !== productId));
    }
    
    setIsAdding(null);
  };

  // Remove story
  const handleRemoveStory = async (storyId: string) => {
    setRemovingId(storyId);
    const result = await removeStory(storyId);
    
    if (result.success) {
      setStories(prev => prev.filter(s => s.id !== storyId));
    }
    
    setRemovingId(null);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = stories.findIndex(s => s.id === String(active.id));
      const newIndex = stories.findIndex(s => s.id === String(over.id));
      
      const newStories = arrayMove(stories, oldIndex, newIndex);
      setStories(newStories);
      
      // Save new order
      await reorderStories(newStories.map(s => s.id));
    }
  };

  // Open media editor
  const handleEditMedia = (story: Story) => {
    setEditingStory(story);
    setMediaUrl(story.customMediaUrl || '');
    setMediaType(story.customMediaType || 'image');
  };

  // Save custom media
  const handleSaveMedia = async () => {
    if (!editingStory) return;
    
    setIsSavingMedia(true);
    try {
      const result = await updateStoryMedia(
        editingStory.id,
        mediaUrl || null,
        mediaUrl ? mediaType : null
      );
      
      if (result.success) {
        // Update local state
        setStories(prev => prev.map(s =>
          s.id === editingStory.id
            ? { ...s, customMediaUrl: mediaUrl || null, customMediaType: mediaUrl ? mediaType : null }
            : s
        ));
        setEditingStory(null);
      }
    } finally {
      setIsSavingMedia(false);
    }
  };

  // Remove custom media
  const handleRemoveMedia = async () => {
    if (!editingStory) return;
    
    setIsSavingMedia(true);
    try {
      const result = await updateStoryMedia(editingStory.id, null, null);
      
      if (result.success) {
        setStories(prev => prev.map(s =>
          s.id === editingStory.id
            ? { ...s, customMediaUrl: null, customMediaType: null }
            : s
        ));
        setMediaUrl('');
        setEditingStory(null);
      }
    } finally {
      setIsSavingMedia(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('settings')}
          className={`
            px-4 py-3 font-medium text-sm border-b-2 -mb-px transition-colors
            ${activeTab === 'settings'
              ? 'border-pink-500 text-pink-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }
          `}
        >
          <Settings className="w-4 h-4 inline-block ml-2" />
          הגדרות
        </button>
        <button
          onClick={() => setActiveTab('stories')}
          className={`
            px-4 py-3 font-medium text-sm border-b-2 -mb-px transition-colors
            ${activeTab === 'stories'
              ? 'border-pink-500 text-pink-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
            }
          `}
        >
          <ImageIcon className="w-4 h-4 inline-block ml-2" />
          מוצרים ({stories.length})
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">הפעל סטוריז</h3>
                <p className="text-sm text-gray-500">הצג סטוריז בחנות</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-pink-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>

          {/* Display Mode */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">מיקום תצוגה</h3>
            <div className="space-y-3">
              {[
                { value: 'home_only', label: 'דף בית בלבד', desc: 'הצג רק בדף הבית' },
                { value: 'category', label: 'דף בית + קטגוריות', desc: 'הצג בדף הבית ובעמודי קטגוריה' },
                { value: 'everywhere', label: 'כל האתר', desc: 'הצג בכל עמוד באתר' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`
                    flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                    ${config.displayMode === option.value
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="displayMode"
                    value={option.value}
                    checked={config.displayMode === option.value}
                    onChange={(e) => setConfig({ ...config, displayMode: e.target.value })}
                    className="hidden"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <p className="text-sm text-gray-500">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Auto Advance */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">זמן מעבר אוטומטי</h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="3"
                max="15"
                value={Number(config.autoAdvanceSeconds) || 5}
                onChange={(e) => setConfig({ ...config, autoAdvanceSeconds: parseInt(e.target.value) })}
                className="flex-1 accent-pink-500"
              />
              <span className="text-gray-700 font-medium w-20">
                {String(config.autoAdvanceSeconds || 5)} שניות
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">תכונות</h3>
            <div className="space-y-4">
              {[
                { key: 'showProductInfo', label: 'הצג מידע על המוצר', desc: 'שם, מחיר ותיאור' },
                { key: 'allowLikes', label: 'אפשר לייקים', desc: 'משתמשים יכולים לעשות לייק' },
                { key: 'allowComments', label: 'אפשר תגובות', desc: 'משתמשים יכולים להגיב' },
                { key: 'allowQuickAdd', label: 'הוספה מהירה לעגלה', desc: 'כפתור הוסף לעגלה מהסטורי' },
              ].map((feature) => (
                <label key={feature.key} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-gray-700">{feature.label}</span>
                    <p className="text-sm text-gray-500">{feature.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!(config as Record<string, unknown>)[feature.key]}
                    onChange={(e) => setConfig({ ...config, [feature.key]: e.target.checked })}
                    className="w-5 h-5 text-pink-500 rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-4">צבעים</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">צבע מסגרת (לא נצפה)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={String(config.circleBorderColor || '#e91e63')}
                    onChange={(e) => setConfig({ ...config, circleBorderColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={String(config.circleBorderColor || '#e91e63')}
                    onChange={(e) => setConfig({ ...config, circleBorderColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">צבע מסגרת (נצפה)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={String(config.viewedBorderColor || '#9e9e9e')}
                    onChange={(e) => setConfig({ ...config, viewedBorderColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={String(config.viewedBorderColor || '#9e9e9e')}
                    onChange={(e) => setConfig({ ...config, viewedBorderColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="w-full py-3 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                שומר...
              </>
            ) : (
              'שמור הגדרות'
            )}
          </button>
        </div>
      )}

      {/* Stories Tab */}
      {activeTab === 'stories' && (
        <div className="space-y-4">
          {/* Add Button */}
          <button
            onClick={() => setShowProductPicker(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            הוסף מוצר לסטוריז
          </button>

          {/* Stories List */}
          {stories.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">אין מוצרים בסטוריז</h3>
              <p className="text-gray-500">הוסף מוצרים כדי להציג אותם בפורמט סטוריז</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={stories.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {stories.map(story => (
                    <SortableStoryItem
                      key={story.id}
                      story={story}
                      onRemove={handleRemoveStory}
                      onEditMedia={handleEditMedia}
                      isRemoving={removingId === story.id}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}

      {/* Product Picker Modal */}
      {showProductPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">בחר מוצר</h3>
              <button
                onClick={() => setShowProductPicker(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="חפש מוצר..."
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-4">
              {isSearching ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'לא נמצאו מוצרים' : 'הקלד לחיפוש'}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleAddProduct(product.id)}
                      disabled={isAdding === product.id}
                      className="w-full flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors text-right disabled:opacity-50"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {product.title}
                        </h4>
                        <span className="text-sm text-gray-500">
                          ₪{product.price.toFixed(2)}
                        </span>
                      </div>
                      {isAdding === product.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                      ) : (
                        <Plus className="w-5 h-5 text-pink-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media Editor Modal */}
      {editingStory && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">הגדר תמונה/סרטון לסטורי</h3>
              <button
                onClick={() => setEditingStory(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Product Info */}
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                  {editingStory.productImage ? (
                    <img
                      src={editingStory.productImage}
                      alt={editingStory.productTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{editingStory.productTitle}</h4>
                  <p className="text-sm text-gray-500">תמונת מוצר מקורית</p>
                </div>
              </div>

              {/* Media Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סוג מדיה
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMediaType('image')}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      mediaType === 'image'
                        ? 'border-pink-500 bg-pink-50 text-pink-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    תמונה
                  </button>
                  <button
                    onClick={() => setMediaType('video')}
                    className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      mediaType === 'video'
                        ? 'border-pink-500 bg-pink-50 text-pink-600'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    סרטון
                  </button>
                </div>
              </div>

              {/* Media URL Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {mediaType === 'video' ? 'קישור לסרטון (MP4)' : 'קישור לתמונה'}
                </label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={mediaType === 'video' 
                    ? 'https://example.com/video.mp4'
                    : 'https://example.com/image.jpg'
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-1">
                  העלה דרך &quot;מדיה&quot; בתפריט הראשי והעתק לינק
                </p>
              </div>

              {/* Preview */}
              {mediaUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תצוגה מקדימה
                  </label>
                  <div className="w-full aspect-square max-w-[200px] mx-auto rounded-xl overflow-hidden bg-gray-100">
                    {mediaType === 'video' ? (
                      <video
                        src={mediaUrl}
                        muted
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt="תצוגה מקדימה"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t flex gap-2">
              {editingStory.customMediaUrl && (
                <button
                  onClick={handleRemoveMedia}
                  disabled={isSavingMedia}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  הסר מדיה מותאמת
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setEditingStory(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleSaveMedia}
                disabled={isSavingMedia || !mediaUrl}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingMedia ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    שומר...
                  </>
                ) : (
                  'שמור'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

