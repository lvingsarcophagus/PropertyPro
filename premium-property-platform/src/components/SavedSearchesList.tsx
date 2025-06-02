// src/components/SavedSearchesList.tsx
'use client';

import { useState, useEffect } from 'react';
import { SavedSearch } from '@/types';
import SavedSearchItem from './SavedSearchItem';

type SavedSearchesListProps = {
  initialSavedSearches: SavedSearch[];
};

const SavedSearchesList: React.FC<SavedSearchesListProps> = ({ initialSavedSearches }) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(initialSavedSearches);

  // Effect to update state if initial prop changes (e.g., after a server refresh)
  useEffect(() => {
    setSavedSearches(initialSavedSearches);
  }, [initialSavedSearches]);

  const handleDeleteOptimistic = (id: string) => {
    setSavedSearches(prevSearches => prevSearches.filter(search => search.id !== id));
  };

  if (savedSearches.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow border border-slate-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
        <p className="text-slate-600">You have no saved searches yet.</p>
        <p className="text-sm text-slate-500 mt-1">Try performing a search and clicking "Save Current Search".</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedSearches.map((search) => (
        <SavedSearchItem
          key={search.id}
          search={search}
          onDelete={handleDeleteOptimistic}
        />
      ))}
    </div>
  );
};

export default SavedSearchesList;
