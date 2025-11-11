// Queue Context for Playlist Queue Management
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Channel, QueueItem } from '../types';
import { StorageService } from '../services/storageService';

interface QueueContextType {
  queue: QueueItem[];
  currentIndex: number;
  currentChannel: Channel | null;
  addToQueue: (channel: Channel, position?: number) => Promise<void>;
  addMultipleToQueue: (channels: Channel[]) => Promise<void>;
  removeFromQueue: (channelId: string) => Promise<void>;
  clearQueue: () => Promise<void>;
  reorderQueue: (fromIndex: number, toIndex: number) => Promise<void>;
  moveToTop: (channelId: string) => Promise<void>;
  moveToBottom: (channelId: string) => Promise<void>;
  shuffleQueue: () => Promise<void>;
  setCurrentIndex: (index: number) => void;
  playNext: () => Channel | null;
  playPrevious: () => Channel | null;
  hasNext: () => boolean;
  hasPrevious: () => boolean;
  isInQueue: (channelId: string) => boolean;
  getQueuePosition: (channelId: string) => number;
  replaceQueue: (channels: Channel[]) => Promise<void>;
  isLoading: boolean;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(true);

  // Load queue on mount
  useEffect(() => {
    loadQueue();
  }, []);

  // Save queue whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveQueue();
    }
  }, [queue]);

  const loadQueue = async () => {
    try {
      setIsLoading(true);
      const savedQueue = await StorageService.loadQueue();
      setQueue(savedQueue);
    } catch (error) {
      console.error('Error loading queue:', error);
      setQueue([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveQueue = async () => {
    try {
      await StorageService.saveQueue(queue);
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  };

  const addToQueue = async (channel: Channel, position?: number) => {
    try {
      // Check if already in queue
      if (isInQueue(channel.id)) {
        console.log('Channel already in queue:', channel.name);
        return;
      }

      const newItem: QueueItem = {
        channel,
        addedAt: new Date(),
        position: queue.length,
      };

      let newQueue: QueueItem[];

      if (position !== undefined && position >= 0 && position <= queue.length) {
        // Insert at specific position
        newQueue = [
          ...queue.slice(0, position),
          newItem,
          ...queue.slice(position),
        ];
        // Update positions
        newQueue = newQueue.map((item, index) => ({ ...item, position: index }));
      } else {
        // Add to end
        newQueue = [...queue, newItem];
      }

      setQueue(newQueue);
      console.log('Added to queue:', channel.name);
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  };

  const addMultipleToQueue = async (channels: Channel[]) => {
    try {
      const newItems: QueueItem[] = channels
        .filter((channel) => !isInQueue(channel.id))
        .map((channel, index) => ({
          channel,
          addedAt: new Date(),
          position: queue.length + index,
        }));

      const newQueue = [...queue, ...newItems];
      setQueue(newQueue);
      console.log(`Added ${newItems.length} channels to queue`);
    } catch (error) {
      console.error('Error adding multiple to queue:', error);
      throw error;
    }
  };

  const removeFromQueue = async (channelId: string) => {
    try {
      const newQueue = queue
        .filter((item) => item.channel.id !== channelId)
        .map((item, index) => ({ ...item, position: index }));

      // Adjust current index if needed
      if (currentIndex >= newQueue.length) {
        setCurrentIndex(Math.max(0, newQueue.length - 1));
      }

      setQueue(newQueue);
      console.log('Removed from queue:', channelId);
    } catch (error) {
      console.error('Error removing from queue:', error);
      throw error;
    }
  };

  const clearQueue = async () => {
    try {
      setQueue([]);
      setCurrentIndex(-1);
      console.log('Queue cleared');
    } catch (error) {
      console.error('Error clearing queue:', error);
      throw error;
    }
  };

  const reorderQueue = async (fromIndex: number, toIndex: number) => {
    try {
      if (fromIndex === toIndex) return;

      const newQueue = [...queue];
      const [movedItem] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedItem);

      // Update positions
      const updatedQueue = newQueue.map((item, index) => ({
        ...item,
        position: index,
      }));

      setQueue(updatedQueue);

      // Adjust current index if needed
      if (currentIndex === fromIndex) {
        setCurrentIndex(toIndex);
      } else if (fromIndex < currentIndex && toIndex >= currentIndex) {
        setCurrentIndex(currentIndex - 1);
      } else if (fromIndex > currentIndex && toIndex <= currentIndex) {
        setCurrentIndex(currentIndex + 1);
      }

      console.log(`Reordered queue: ${fromIndex} -> ${toIndex}`);
    } catch (error) {
      console.error('Error reordering queue:', error);
      throw error;
    }
  };

  const moveToTop = async (channelId: string) => {
    try {
      const index = queue.findIndex((item) => item.channel.id === channelId);
      if (index > 0) {
        await reorderQueue(index, 0);
      }
    } catch (error) {
      console.error('Error moving to top:', error);
      throw error;
    }
  };

  const moveToBottom = async (channelId: string) => {
    try {
      const index = queue.findIndex((item) => item.channel.id === channelId);
      if (index >= 0 && index < queue.length - 1) {
        await reorderQueue(index, queue.length - 1);
      }
    } catch (error) {
      console.error('Error moving to bottom:', error);
      throw error;
    }
  };

  const shuffleQueue = async () => {
    try {
      const currentChannel = currentIndex >= 0 ? queue[currentIndex]?.channel : null;

      // Shuffle array using Fisher-Yates algorithm
      const newQueue = [...queue];
      for (let i = newQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
      }

      // Update positions
      const shuffledQueue = newQueue.map((item, index) => ({
        ...item,
        position: index,
      }));

      setQueue(shuffledQueue);

      // Update current index to match the current channel
      if (currentChannel) {
        const newIndex = shuffledQueue.findIndex(
          (item) => item.channel.id === currentChannel.id
        );
        setCurrentIndex(newIndex);
      }

      console.log('Queue shuffled');
    } catch (error) {
      console.error('Error shuffling queue:', error);
      throw error;
    }
  };

  const playNext = (): Channel | null => {
    if (!hasNext()) return null;

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    return queue[nextIndex].channel;
  };

  const playPrevious = (): Channel | null => {
    if (!hasPrevious()) return null;

    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    return queue[prevIndex].channel;
  };

  const hasNext = (): boolean => {
    return currentIndex < queue.length - 1;
  };

  const hasPrevious = (): boolean => {
    return currentIndex > 0;
  };

  const isInQueue = (channelId: string): boolean => {
    return queue.some((item) => item.channel.id === channelId);
  };

  const getQueuePosition = (channelId: string): number => {
    return queue.findIndex((item) => item.channel.id === channelId);
  };

  const replaceQueue = async (channels: Channel[]) => {
    try {
      const newQueue: QueueItem[] = channels.map((channel, index) => ({
        channel,
        addedAt: new Date(),
        position: index,
      }));

      setQueue(newQueue);
      setCurrentIndex(0);
      console.log(`Queue replaced with ${channels.length} channels`);
    } catch (error) {
      console.error('Error replacing queue:', error);
      throw error;
    }
  };

  const currentChannel = currentIndex >= 0 && currentIndex < queue.length
    ? queue[currentIndex].channel
    : null;

  return (
    <QueueContext.Provider
      value={{
        queue,
        currentIndex,
        currentChannel,
        addToQueue,
        addMultipleToQueue,
        removeFromQueue,
        clearQueue,
        reorderQueue,
        moveToTop,
        moveToBottom,
        shuffleQueue,
        setCurrentIndex,
        playNext,
        playPrevious,
        hasNext,
        hasPrevious,
        isInQueue,
        getQueuePosition,
        replaceQueue,
        isLoading,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

// Custom hook to use queue
export const useQueue = (): QueueContextType => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};

// Helper hook for current playback
export const useCurrentPlayback = () => {
  const { currentChannel, currentIndex, queue, playNext, playPrevious, hasNext, hasPrevious } =
    useQueue();

  return {
    current: currentChannel,
    currentIndex,
    totalItems: queue.length,
    playNext,
    playPrevious,
    hasNext: hasNext(),
    hasPrevious: hasPrevious(),
  };
};
