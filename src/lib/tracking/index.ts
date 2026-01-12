/**
 * QuickShop Tracking System
 * 
 * 14 E-commerce Events - More than Shopify!
 * 
 * Usage:
 * 1. Import tracker: import { tracker } from '@/lib/tracking'
 * 2. Initialize in layout: tracker.init(config)
 * 3. Track events: tracker.addToCart({ id: '...', name: '...', price: 100, quantity: 1 })
 */

export { tracker } from './tracker';
export type { 
  TrackingConfig, 
  TrackingEventType, 
  TrackingEventPayload,
  ProductData,
  CartData,
  OrderData,
  UserData,
  SearchData,
} from './types';



