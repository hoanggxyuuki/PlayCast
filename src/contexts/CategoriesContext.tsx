
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CategorySettings {
  id: string;
  name: string;
  isHidden: boolean;
  order: number;
  color?: string;
  icon?: string;
}

interface CategoriesContextType {
  categories: CategorySettings[];
  hiddenCategories: Set<string>;
  toggleCategoryVisibility: (categoryName: string) => void;
  reorderCategories: (fromIndex: number, toIndex: number) => void;
  setCategoryColor: (categoryName: string, color: string) => void;
  setCategoryIcon: (categoryName: string, icon: string) => void;
  resetCategories: () => void;
  isHidden: (categoryName: string) => boolean;
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

const CATEGORIES_STORAGE_KEY = '@playcast_categories';

export const CategoriesProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<CategorySettings[]>([]);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        setCategories(parsed);
        setHiddenCategories(new Set(parsed.filter((c: CategorySettings) => c.isHidden).map((c: CategorySettings) => c.name)));
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const saveCategories = async (newCategories: CategorySettings[]) => {
    try {
      await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(newCategories));
      setCategories(newCategories);
      setHiddenCategories(new Set(newCategories.filter(c => c.isHidden).map(c => c.name)));
    } catch (error) {
      console.error('Failed to save categories:', error);
    }
  };

  const toggleCategoryVisibility = (categoryName: string) => {
    const newCategories = categories.map(c =>
      c.name === categoryName ? { ...c, isHidden: !c.isHidden } : c
    );
    saveCategories(newCategories);
  };

  const reorderCategories = (fromIndex: number, toIndex: number) => {
    const newCategories = [...categories];
    const [removed] = newCategories.splice(fromIndex, 1);
    newCategories.splice(toIndex, 0, removed);


    const reordered = newCategories.map((c, index) => ({ ...c, order: index }));
    saveCategories(reordered);
  };

  const setCategoryColor = (categoryName: string, color: string) => {
    const newCategories = categories.map(c =>
      c.name === categoryName ? { ...c, color } : c
    );
    saveCategories(newCategories);
  };

  const setCategoryIcon = (categoryName: string, icon: string) => {
    const newCategories = categories.map(c =>
      c.name === categoryName ? { ...c, icon } : c
    );
    saveCategories(newCategories);
  };

  const resetCategories = () => {
    saveCategories([]);
  };

  const isHidden = (categoryName: string) => {
    return hiddenCategories.has(categoryName);
  };

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        hiddenCategories,
        toggleCategoryVisibility,
        reorderCategories,
        setCategoryColor,
        setCategoryIcon,
        resetCategories,
        isHidden,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within CategoriesProvider');
  }
  return context;
};
