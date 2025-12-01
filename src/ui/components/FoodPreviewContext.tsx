import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CreateFoodRequest } from '../../../types/food.js';

interface FoodPreviewContextType {
  previewData: CreateFoodRequest[];
  setPreviewData: React.Dispatch<React.SetStateAction<CreateFoodRequest[]>>;
  clearPreviewData: () => void;
  hasUnsavedData: boolean;
}

const FoodPreviewContext = createContext<FoodPreviewContextType | undefined>(undefined);

export const useFoodPreview = () => {
  const context = useContext(FoodPreviewContext);
  if (!context) {
    throw new Error('useFoodPreview must be used within FoodPreviewProvider');
  }
  return context;
};

interface FoodPreviewProviderProps {
  children: ReactNode;
}

export const FoodPreviewProvider: React.FC<FoodPreviewProviderProps> = ({ children }) => {
  const [previewData, setPreviewData] = useState<CreateFoodRequest[]>([]);

  const clearPreviewData = () => {
    setPreviewData([]);
  };

  const hasUnsavedData = previewData.length > 0;

  return (
    <FoodPreviewContext.Provider
      value={{
        previewData,
        setPreviewData,
        clearPreviewData,
        hasUnsavedData,
      }}
    >
      {children}
    </FoodPreviewContext.Provider>
  );
};