import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './AuthContext';

export interface SavedItem {
  id: string;
  user_saved_id: string;
  type: 'destination' | 'hidden_gem' | 'guide' | 'stay';
  data: any;
  collection_name: string;
  created_at: string;
}

export function useSaved() {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const fetchSaved = useCallback(async () => {
    if (!user) {
      setSavedItems([]);
      setSavedIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_saved')
        .select(`
          id,
          collection_name,
          created_at,
          destination_id,
          hidden_gem_id,
          guide_id,
          stay_id,
          destinations (*),
          hidden_gems (*),
          guides (*),
          stays (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: SavedItem[] = [];
      const ids = new Set<string>();

      (data || []).forEach((item: any) => {
        if (item.destinations) {
          items.push({
            id: item.destinations.id,
            user_saved_id: item.id,
            type: 'destination',
            data: item.destinations,
            collection_name: item.collection_name,
            created_at: item.created_at,
          });
          ids.add(`destination_${item.destinations.id}`);
        }
        if (item.hidden_gems) {
          items.push({
            id: item.hidden_gems.id,
            user_saved_id: item.id,
            type: 'hidden_gem',
            data: item.hidden_gems,
            collection_name: item.collection_name,
            created_at: item.created_at,
          });
          ids.add(`hidden_gem_${item.hidden_gems.id}`);
        }
        if (item.guides) {
          items.push({
            id: item.guides.id,
            user_saved_id: item.id,
            type: 'guide',
            data: item.guides,
            collection_name: item.collection_name,
            created_at: item.created_at,
          });
          ids.add(`guide_${item.guides.id}`);
        }
        if (item.stays) {
          items.push({
            id: item.stays.id,
            user_saved_id: item.id,
            type: 'stay',
            data: item.stays,
            collection_name: item.collection_name,
            created_at: item.created_at,
          });
          ids.add(`stay_${item.stays.id}`);
        }
      });

      setSavedItems(items);
      setSavedIds(ids);
    } catch (err) {
      console.error('Error fetching saved items:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const isSaved = useCallback((type: 'destination' | 'hidden_gem' | 'guide' | 'stay', id: string) => {
    return savedIds.has(`${type}_${id}`);
  }, [savedIds]);

  const toggleSave = useCallback(async (
    type: 'destination' | 'hidden_gem' | 'guide' | 'stay',
    id: string,
    collectionName: string = 'default'
  ) => {
    if (!user) return false;

    const key = `${type}_${id}`;
    const isCurrentlySaved = savedIds.has(key);

    if (isCurrentlySaved) {
      // Find and delete
      const item = savedItems.find(s => s.type === type && s.id === id);
      if (item) {
        const { error } = await supabase
          .from('user_saved')
          .delete()
          .eq('id', item.user_saved_id);

        if (error) {
          console.error('Error unsaving:', error);
          return false;
        }
        setSavedIds(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setSavedItems(prev => prev.filter(s => !(s.type === type && s.id === id)));
      }
    } else {
      // Insert new saved item
      const insertData: any = {
        user_id: user.id,
        collection_name: collectionName,
      };

      if (type === 'destination') insertData.destination_id = id;
      else if (type === 'hidden_gem') insertData.hidden_gem_id = id;
      else if (type === 'guide') insertData.guide_id = id;
      else if (type === 'stay') insertData.stay_id = id;

      const { error } = await supabase
        .from('user_saved')
        .insert(insertData);

      if (error) {
        console.error('Error saving:', error);
        return false;
      }

      // Refetch to get the new item with joined data
      fetchSaved();
    }

    return true;
  }, [user, savedIds, savedItems, fetchSaved]);

  const removeSaved = useCallback(async (userSavedId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('user_saved')
      .delete()
      .eq('id', userSavedId);

    if (error) {
      console.error('Error removing saved item:', error);
      return false;
    }

    setSavedItems(prev => prev.filter(s => s.user_saved_id !== userSavedId));
    return true;
  }, [user]);

  return {
    savedItems,
    loading,
    savedIds,
    isSaved,
    toggleSave,
    removeSaved,
    refetch: fetchSaved,
  };
}
