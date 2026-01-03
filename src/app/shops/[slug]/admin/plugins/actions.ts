'use server';

/**
 * Plugin Actions - Server Actions
 * 
 * ⚡ Fire-and-forget pattern for non-blocking operations
 */

import { revalidatePath } from 'next/cache';
import { 
  installPlugin as installPluginLoader,
  uninstallPlugin as uninstallPluginLoader,
  updatePluginConfig as updatePluginConfigLoader,
} from '@/lib/plugins/loader';

export async function installPlugin(
  storeId: string,
  pluginSlug: string,
  config?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const result = await installPluginLoader(storeId, pluginSlug, config);
  
  if (result.success) {
    revalidatePath('/shops/[slug]/admin/plugins', 'page');
  }
  
  return result;
}

export async function uninstallPlugin(
  storeId: string,
  pluginSlug: string
): Promise<{ success: boolean; error?: string }> {
  const result = await uninstallPluginLoader(storeId, pluginSlug);
  
  if (result.success) {
    revalidatePath('/shops/[slug]/admin/plugins', 'page');
  }
  
  return result;
}

export async function updatePluginConfig(
  storeId: string,
  pluginSlug: string,
  config: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const result = await updatePluginConfigLoader(storeId, pluginSlug, config);
  
  if (result.success) {
    revalidatePath('/shops/[slug]/admin/plugins', 'page');
  }
  
  return result;
}


