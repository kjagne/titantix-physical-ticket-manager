import { useState, useCallback, useEffect } from 'react';
import { TicketTypeInfo } from '../types';
import { db, TicketDesign } from '../services/api-database';

export const useDesignManager = () => {
  const [designs, setDesigns] = useState<TicketDesign[]>([]);
  const [currentDesign, setCurrentDesign] = useState<TicketDesign | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);

  const loadDesigns = useCallback(async () => {
    try {
      const allDesigns = await db.getAllDesigns();
      setDesigns(allDesigns);
      console.log('Loaded designs:', allDesigns.length);
    } catch (error) {
      console.error('Failed to load designs:', error);
    }
  }, []);

  // Initialize database and load designs on mount
  useEffect(() => {
    const initAndLoad = async () => {
      try {
        await db.init();
        setIsDbReady(true);
        await loadDesigns();
      } catch (error) {
        console.error('Failed to initialize design manager:', error);
      }
    };
    initAndLoad();
  }, [loadDesigns]);

  const saveDesign = useCallback(async (
    name: string,
    backgroundImageUrl: string | undefined,
    imageScale: number,
    imagePositionX: number,
    imagePositionY: number,
    ticketTypes: TicketTypeInfo[]
  ): Promise<TicketDesign> => {
    setIsLoading(true);
    try {
      const design: TicketDesign = {
        id: `design-${Date.now()}`,
        name,
        backgroundImageUrl,
        imageScale,
        imagePositionX,
        imagePositionY,
        ticketTypes: ticketTypes.map(t => ({ ...t })), // Deep copy
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.saveDesign(design);
      await loadDesigns();
      setCurrentDesign(design);
      console.log('Design saved successfully:', design.name, 'ID:', design.id);
      return design;
    } catch (error) {
      console.error('Failed to save design:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadDesigns]);

  const updateDesign = useCallback(async (
    id: string,
    updates: Partial<Omit<TicketDesign, 'id' | 'createdAt'>>
  ): Promise<void> => {
    setIsLoading(true);
    try {
      const existing = await db.getDesign(id);
      if (!existing) throw new Error('Design not found');

      const updated: TicketDesign = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await db.saveDesign(updated);
      await loadDesigns();
      if (currentDesign?.id === id) {
        setCurrentDesign(updated);
      }
      console.log('Design updated:', updated.name);
    } catch (error) {
      console.error('Failed to update design:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentDesign, loadDesigns]);

  const loadDesign = useCallback(async (id: string): Promise<TicketDesign | null> => {
    try {
      const design = await db.getDesign(id);
      if (design) {
        setCurrentDesign(design);
        return design;
      }
      return null;
    } catch (error) {
      console.error('Failed to load design:', error);
      return null;
    }
  }, []);

  const deleteDesign = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      await db.deleteDesign(id);
      await loadDesigns();
      if (currentDesign?.id === id) {
        setCurrentDesign(null);
      }
      console.log('Design deleted:', id);
    } catch (error) {
      console.error('Failed to delete design:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentDesign, loadDesigns]);

  return {
    designs,
    currentDesign,
    isLoading,
    isDbReady,
    saveDesign,
    updateDesign,
    loadDesign,
    deleteDesign,
    setCurrentDesign,
  };
};
