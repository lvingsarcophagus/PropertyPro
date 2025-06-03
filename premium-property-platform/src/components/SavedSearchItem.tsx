// src/components/SavedSearchItem.tsx
'use client';

import { useState } from 'react';
// import Link from 'next/link'; // Not used directly for navigation if using router.push
import { useRouter } from 'next/navigation';
import { SavedSearch } from '@/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useI18n } from '@/lib/i18n/index';
import { PlayCircle, Trash2, AlertCircle } from 'lucide-react'; // Icons

type SavedSearchItemProps = {
  search: SavedSearch;
  onDelete: (id: string) => void;
};

const SavedSearchItem: React.FC<SavedSearchItemProps> = ({ search, onDelete }) => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { t } = useI18n();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplySearch = () => {
    const filtersQueryString = encodeURIComponent(JSON.stringify(search.filters));
    router.push(`/search?filters=${filtersQueryString}`);
  };

  const handleDelete = async () => {
    if (window.confirm(t('saved_searches.confirm_delete_message', { name: search.name }))) {
      setIsDeleting(true);
      setError(null);
      try {
        const { error: deleteError } = await supabase
          .from('saved_searches')
          .delete()
          .eq('id', search.id);

        if (deleteError) throw deleteError;

        onDelete(search.id);
      } catch (err: any) {
        console.error('Error deleting saved search:', err);
        setError(err.message || t('saved_searches.error_delete_failed'));
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const summarizeFilters = (filters: SavedSearch['filters']): string => {
    const parts: string[] = [];
    if (filters.propertyType) parts.push(`${t('common.type')}: ${t(`property_details_page.value_type_${filters.propertyType.toLowerCase()}`, {}, { fallback: filters.propertyType })}`);
    if (filters.purpose) parts.push(`${t('common.purpose')}: ${t(`property_details_page.value_purpose_${filters.purpose.toLowerCase()}`, {}, { fallback: filters.purpose })}`);
    if (filters.city) parts.push(`${t('common.city')}: ${filters.city}`); // Assuming city is not a key itself
    if (filters.district) parts.push(`${t('property_details_page.label_district')}: ${filters.district}`);
    if (filters.minPrice || filters.maxPrice) {
        parts.push(`${t('common.price')}: ${filters.minPrice || '*'} - ${filters.maxPrice || '*'}`);
    }
    if (parts.length === 0) return t('saved_searches.filters_any_property');
    return parts.slice(0, 3).join(', ') + (parts.length > 3 ? '...' : '');
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 shadow rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md dark:hover:shadow-slate-700/50 transition-shadow">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex-grow mb-3 sm:mb-0">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{search.name}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {t('saved_searches.filters_label')}: {summarizeFilters(search.filters)}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {t('saved_searches.saved_on_label')}: {new Date(search.created_at).toLocaleDateString()}
            </p>
        </div>
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 w-full sm:w-auto">
          <button
            onClick={handleApplySearch}
            title={t('saved_searches.apply_button_title')}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <PlayCircle size={18} className="mr-2"/>{t('saved_searches.apply_button')}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title={t('common.delete')}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-slate-400 dark:disabled:bg-slate-600"
          >
            {isDeleting ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>{t('common.deleting')}</> : <><Trash2 size={16} className="mr-2"/>{t('common.delete')}</>}
          </button>
        </div>
      </div>
      {error && (
        <div className="mt-2 text-red-600 dark:text-red-400 text-xs flex items-center">
            <AlertCircle size={14} className="mr-1.5"/> {error}
        </div>
      )}
    </div>
  );
};

export default SavedSearchItem;
