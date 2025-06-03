// src/components/SavedSearchItem.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link'; // For the "Apply" button if not using router.push directly
import { useRouter } from 'next/navigation';
import { SavedSearch } from '@/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type SavedSearchItemProps = {
  search: SavedSearch;
  onDelete: (id: string) => void;
};

const SavedSearchItem: React.FC<SavedSearchItemProps> = ({ search, onDelete }) => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplySearch = () => {
    const filtersQueryString = encodeURIComponent(JSON.stringify(search.filters));
    router.push(`/search?filters=${filtersQueryString}`);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the saved search "${search.name}"?`)) {
      setIsDeleting(true);
      setError(null);
      try {
        const { error: deleteError } = await supabase
          .from('saved_searches')
          .delete()
          .eq('id', search.id);

        if (deleteError) throw deleteError;

        onDelete(search.id); // Notify parent for optimistic UI update
      } catch (err: any) {
        console.error('Error deleting saved search:', err);
        setError(err.message || 'Failed to delete search.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Function to summarize filters for display (optional, can be simple)
  const summarizeFilters = (filters: SavedSearch['filters']): string => {
    const parts: string[] = [];
    if (filters.propertyType) parts.push(`Type: ${filters.propertyType}`);
    if (filters.purpose) parts.push(`For: ${filters.purpose}`);
    if (filters.city) parts.push(`City: ${filters.city}`);
    if (filters.district) parts.push(`District: ${filters.district}`);
    if (filters.minPrice || filters.maxPrice) {
        parts.push(`Price: ${filters.minPrice || '*'} - ${filters.maxPrice || '*'}`);
    }
    if (parts.length === 0) return "Any property";
    return parts.slice(0, 3).join(', ') + (parts.length > 3 ? '...' : '');
  };

  return (
    <div className="bg-white p-4 shadow rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
            <h3 className="text-lg font-semibold text-slate-800">{search.name}</h3>
            <p className="text-sm text-slate-600 mt-1">
                Filters: {summarizeFilters(search.filters)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
                Saved on: {new Date(search.created_at).toLocaleDateString()}
            </p>
        </div>
        <div className="mt-3 sm:mt-0 flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 w-full sm:w-auto">
          <button
            onClick={handleApplySearch}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Apply
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-slate-300"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default SavedSearchItem;
