// src/app/search/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import PropertyCard from '@/components/PropertyCard';
import { Property } from '@/types'; // Assuming SavedSearchFilters type will be part of this
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

// Define a more specific type for filters from URL, matching SavedSearch['filters']
type UrlFilters = {
  propertyType?: string;
  purpose?: string;
  city?: string;
  district?: string;
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  maxArea?: string;
  rooms?: string;
  floor?: string;
  heatingType?: string;
  keywords?: string;
  sortBy?: string;
  sortOrder?: string;
};

export default function SearchPage() {
  // Filter states
  const [propertyType, setPropertyType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [rooms, setRooms] = useState('');
  const [floor, setFloor] = useState('');
  const [heatingType, setHeatingType] = useState('');
  const [keywords, setKeywords] = useState('');

  // Sorting states
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(9); // Items per page

  // Results and loading states
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saved Search states
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [saveSearchError, setSaveSearchError] = useState<string | null>(null);
  const [saveSearchSuccess, setSaveSearchSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Flag to indicate if initial filters from URL have been applied
  const [initialFiltersApplied, setInitialFiltersApplied] = useState(false);


  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
    };
    fetchUser();
  }, [supabase.auth]);

  // Effect to parse URL parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filtersParam = params.get('filters');
    if (filtersParam) {
      try {
        const parsedFilters = JSON.parse(filtersParam) as UrlFilters;
        setPropertyType(parsedFilters.propertyType || '');
        setPurpose(parsedFilters.purpose || '');
        setCity(parsedFilters.city || '');
        setDistrict(parsedFilters.district || '');
        setMinPrice(parsedFilters.minPrice || '');
        setMaxPrice(parsedFilters.maxPrice || '');
        setMinArea(parsedFilters.minArea || '');
        setMaxArea(parsedFilters.maxArea || '');
        setRooms(parsedFilters.rooms || '');
        setFloor(parsedFilters.floor || '');
        setHeatingType(parsedFilters.heatingType || '');
        setKeywords(parsedFilters.keywords || '');
        setSortBy(parsedFilters.sortBy || 'created_at');
        setSortOrder(parsedFilters.sortOrder || 'desc');
        setCurrentPage(1); // Always start at page 1 when applying filters from URL
      } catch (e) {
        console.error("Error parsing filters from URL:", e);
        setError("Could not apply filters from URL.");
      }
    }
    setInitialFiltersApplied(true); // Mark initial filters as applied (or attempted)
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount


  const handleSearch = useCallback(async (isNewSearchContext = false) => {
    const pageToFetch = isNewSearchContext ? 1 : currentPage;
     if (isNewSearchContext && currentPage !== 1) {
        // This case is tricky. If isNewSearchContext is true, we intend to go to page 1.
        // If currentPage is already not 1, setCurrentPage(1) will trigger the other useEffect.
        // So, we might not need to proceed with the fetch here if currentPage will change.
        // However, if currentPage is already 1, then the other useEffect won't trigger on page change.
        setCurrentPage(1);
        // If already on page 1, the search must proceed from here.
        // If not on page 1, the useEffect listening to currentPage will take over.
        if (currentPage === 1) {
            // Proceed with fetch using pageToFetch = 1
        } else {
            return; // Let the useEffect triggered by setCurrentPage(1) handle the search
        }
    }

    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    // Append filters only if they have values
    if (propertyType) params.append('propertyType', propertyType);
    if (purpose) params.append('purpose', purpose);
    if (city) params.append('city', city);
    if (district) params.append('district', district);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (minArea) params.append('minArea', minArea);
    if (maxArea) params.append('maxArea', maxArea);
    if (rooms) params.append('rooms', rooms);
    if (floor) params.append('floor', floor);
    if (heatingType) params.append('heatingType', heatingType);
    if (keywords) params.append('keywords', keywords);

    params.append('sortBy', sortBy);
    params.append('sortOrder', sortOrder);
    params.append('page', String(pageToFetch));
    params.append('limit', String(limit));
    const queryString = params.toString();

    try {
      const response = await fetch(`/api/search?${queryString}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API Error: ${response.statusText}`);
      }
      const data = await response.json();
      setSearchResults(data.properties || []);
      setTotalPages(data.totalPages || 0);
      setTotalCount(data.count || 0);
      if (isNewSearchContext) setCurrentPage(1);


    } catch (err: any) {
      console.error("Search API call failed:", err);
      setError(err.message || 'Failed to fetch search results.');
      setSearchResults([]);
      setTotalPages(0);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    propertyType, purpose, city, district, minPrice, maxPrice,
    minArea, maxArea, rooms, floor, heatingType, keywords,
    sortBy, sortOrder, limit, currentPage
  ]);

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch(true);
  };

  const handleSortChange = () => {
    handleSearch(true);
  };

  // Main useEffect for triggering search when critical states change
  useEffect(() => {
    if (initialFiltersApplied) { // Only run after initial URL params have been processed
        handleSearch(currentPage === 1 && !window.location.search.includes('filters='));
        // Pass true if it's effectively a new search context (page 1 and not from URL filters directly)
        // This logic might need refinement based on desired behavior for URL filters vs manual changes.
        // A simpler approach: if filters were applied from URL, they set states, then this useEffect runs.
        // If any of these deps change due to user interaction, it also runs.
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortBy, sortOrder, initialFiltersApplied]); // handleSearch removed to simplify dep management

  // This useEffect is to make sure handleSearch is called AFTER states from URL are set.
  useEffect(() => {
    if(initialFiltersApplied) {
        // This call ensures that if URL parameters set the state, a search is triggered.
        // If called from onFormSubmit or handleSortChange, those would have already set currentPage to 1.
        handleSearch(true); // Consider this a new search context after URL filters are applied
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyType, purpose, city, district, minPrice, maxPrice, minArea, maxArea, rooms, floor, heatingType, keywords, initialFiltersApplied]);


  const handleResetFilters = () => {
    setPropertyType(''); setPurpose(''); setCity(''); setDistrict('');
    setMinPrice(''); setMaxPrice(''); setMinArea(''); setMaxArea('');
    setRooms(''); setFloor(''); setHeatingType(''); setKeywords('');
    setSortBy('created_at'); setSortOrder('desc'); setError(null);

    if (currentPage === 1) {
        handleSearch(true);
    } else {
        setCurrentPage(1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleInitiateSaveSearch = () => {
    setSaveSearchName('');
    setSaveSearchError(null);
    setSaveSearchSuccess(null);
    setShowSaveSearchModal(true);
  };

  const executeSaveSearch = async () => {
    if (!saveSearchName.trim()) {
      setSaveSearchError('Please provide a name for your search.');
      return;
    }
    if (!currentUser) {
      setSaveSearchError('You must be logged in to save a search.');
      return;
    }

    setSaveSearchError(null);
    setSaveSearchSuccess(null);
    // Using a specific loading state for save operation might be better if main search takes long
    // For now, re-using general isLoading, or just rely on button disabled state.
    // setIsSaving(true);

    const currentFilters: UrlFilters = { // Use UrlFilters type for consistency
      propertyType, purpose, city, district, minPrice, maxPrice,
      minArea, maxArea, rooms, floor, heatingType, keywords,
      sortBy, sortOrder,
    };
     // Remove empty keys to keep saved filters clean
    Object.keys(currentFilters).forEach(key => {
        const typedKey = key as keyof UrlFilters;
        if (currentFilters[typedKey] === '' || currentFilters[typedKey] === undefined || currentFilters[typedKey] === null) {
            delete currentFilters[typedKey];
        }
    });


    try {
      const { error: insertError } = await supabase
        .from('saved_searches')
        .insert({
          user_id: currentUser.id,
          name: saveSearchName,
          filters: currentFilters, // This is a JSONB field, Supabase client handles stringification
        });

      if (insertError) throw insertError;

      setSaveSearchSuccess(`Search "${saveSearchName}" saved successfully!`);
      setSaveSearchName('');
    } catch (err: any) {
      console.error('Error saving search:', err);
      setSaveSearchError(err.message || 'Failed to save search.');
    } finally {
      // setIsSaving(false);
    }
  };

  // JSX remains largely the same as the previous version
  // Ensure all filter inputs correctly use their respective state setters (e.g., onChange={(e) => setPropertyType(e.target.value)})
  return (
    <div className="container mx-auto p-4 lg:p-6 min-h-screen">
      <div className="lg:flex lg:space-x-6">
        {/* Filter Panel */}
        <aside className="lg:w-1/4 mb-6 lg:mb-0">
          <form onSubmit={onFormSubmit} className="bg-white p-6 shadow-lg rounded-lg sticky top-6">
            <h2 className="text-2xl font-semibold mb-6 text-slate-800">Filter Properties</h2>

            {/* Basic Filters */}
            <div className="mb-4">
              <label htmlFor="propertyType" className="block text-sm font-medium text-slate-700 mb-1">Property Type</label>
              <select id="propertyType" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500">
                <option value="">Any Type</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="purpose" className="block text-sm font-medium text-slate-700 mb-1">Purpose</label>
              <select id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500">
                <option value="">Any Purpose</option>
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Vilnius" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>

            <div className="mb-6">
              <label htmlFor="district" className="block text-sm font-medium text-slate-700 mb-1">District</label>
              <input type="text" id="district" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g., Antakalnis" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>

            <hr className="my-6 border-slate-300" />
            <h3 className="text-xl font-semibold mb-4 text-slate-700">Advanced Filters</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="minPrice" className="block text-sm font-medium text-slate-700 mb-1">Min Price</label>
                <input type="number" id="minPrice" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="$" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500" />
              </div>
              <div>
                <label htmlFor="maxPrice" className="block text-sm font-medium text-slate-700 mb-1">Max Price</label>
                <input type="number" id="maxPrice" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="$" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="minArea" className="block text-sm font-medium text-slate-700 mb-1">Min Area (m²)</label>
                <input type="number" id="minArea" value={minArea} onChange={(e) => setMinArea(e.target.value)} placeholder="m²" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500" />
              </div>
              <div>
                <label htmlFor="maxArea" className="block text-sm font-medium text-slate-700 mb-1">Max Area (m²)</label>
                <input type="number" id="maxArea" value={maxArea} onChange={(e) => setMaxArea(e.target.value)} placeholder="m²" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500" />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="rooms" className="block text-sm font-medium text-slate-700 mb-1">Number of Rooms</label>
              <input type="number" id="rooms" value={rooms} onChange={(e) => setRooms(e.target.value)} placeholder="e.g., 3" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>

            <div className="mb-4">
              <label htmlFor="floor" className="block text-sm font-medium text-slate-700 mb-1">Floor Number</label>
              <input type="number" id="floor" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="e.g., 2" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>

            <div className="mb-4">
              <label htmlFor="heatingType" className="block text-sm font-medium text-slate-700 mb-1">Heating Type</label>
              <select id="heatingType" value={heatingType} onChange={(e) => setHeatingType(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500">
                <option value="">Any</option>
                <option value="central">Central</option>
                <option value="gas">Gas</option>
                <option value="electric">Electric</option>
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="keywords" className="block text-sm font-medium text-slate-700 mb-1">Keyword Search</label>
              <input type="text" id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g., balcony, renovated" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500" />
            </div>


            <div className="flex flex-col space-y-3">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold py-2 px-4 rounded-md transition duration-300 disabled:bg-slate-400"
                >
                    {isLoading ? 'Searching...' : 'Apply Filters'}
                </button>
                <button
                    type="button"
                    onClick={handleResetFilters}
                    className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
                >
                    Reset Filters
                </button>
                {currentUser && (
                  <button
                    type="button"
                    onClick={handleInitiateSaveSearch}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300 mt-2"
                  >
                    Save Current Search
                  </button>
                )}
            </div>
          </form>
        </aside>

        {/* Results Area */}
        <main className="lg:w-3/4">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Search Results <span className="text-lg font-normal text-slate-600">({totalCount} found)</span></h1>
            <div className="flex gap-2 items-center">
                <label htmlFor="sortBy" className="text-sm font-medium text-slate-700">Sort by:</label>
                <select
                    id="sortBy"
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); handleSortChange(); }}
                    className="p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
                >
                    <option value="created_at">Date Posted</option>
                    <option value="price">Price</option>
                    <option value="area_m2">Area</option>
                </select>
                <select
                    id="sortOrder"
                    value={sortOrder}
                    onChange={(e) => { setSortOrder(e.target.value); handleSortChange(); }}
                    className="p-2 border border-slate-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-sm"
                >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                </select>
            </div>
          </div>

          {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}

          {isLoading && searchResults.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-600 text-lg">Loading results...</p>
              <svg className="animate-spin h-8 w-8 text-amber-500 mx-auto mt-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {searchResults.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 flex justify-between items-center">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage <= 1 || isLoading}
                    className="bg-slate-500 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-slate-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages || isLoading}
                    className="bg-slate-500 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : !isLoading ? (
            <div className="text-center py-10">
              <p className="text-slate-600 text-lg">No properties found matching your criteria. Try adjusting your filters.</p>
            </div>
          ) : null }
        </main>
      </div>

      {/* Save Search Modal */}
      {showSaveSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-slate-800">Save Search</h3>
            {saveSearchError && <p className="text-red-500 bg-red-100 p-2 rounded-md mb-3 text-sm">{saveSearchError}</p>}
            {saveSearchSuccess && <p className="text-green-500 bg-green-100 p-2 rounded-md mb-3 text-sm">{saveSearchSuccess}</p>}

            {!saveSearchSuccess && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="saveSearchName" className="block text-sm font-medium text-slate-700">Search Name</label>
                  <input
                    type="text"
                    id="saveSearchName"
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm p-2"
                    placeholder="e.g., My Vilnius Apartment Hunt"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSaveSearchModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                    disabled={isLoading && !saveSearchError && !saveSearchSuccess}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeSaveSearch}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition disabled:bg-slate-400"
                  >
                    {isLoading && !saveSearchError && !saveSearchSuccess ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
            {saveSearchSuccess && (
                 <div className="flex justify-end mt-4">
                    <button
                        type="button"
                        onClick={() => { setShowSaveSearchModal(false); setSaveSearchSuccess(null); }}
                        className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition"
                    >
                        Close
                    </button>
                 </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
