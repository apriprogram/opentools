import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Video, Image as ImageIcon, Search, ArrowUpRight, Music, Film } from 'lucide-react';
import Card from '../ui/Card';
import { useTranslation } from 'react-i18next';

export default function ConverterCategoryList({ categories = [], isCompressor = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase().trim();

    return categories
      .map((cat) => {
        const matchingTools = cat.tools.filter(
          (t) =>
            t.label.toLowerCase().includes(query) ||
            t.description?.toLowerCase().includes(query) ||
            t.from.some((f) => f.toLowerCase().includes(query)) ||
            t.to.some((f) => f.toLowerCase().includes(query))
        );
        return { ...cat, tools: matchingTools };
      })
      .filter((cat) => cat.tools.length > 0);
  }, [categories, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Kolom pencarian */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar matching section 3.9 */}
        <div className="relative w-full max-w-[540px]">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-secondary">
            <Search size={18} strokeWidth={1.75} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('category_list.search_placeholder', 'Search tool (e.g. mp4 to mp3, webp, png...)')}
            className="w-full h-[44px] pl-10 pr-4 bg-card border border-border hover:border-border-hover focus:border-border-focus rounded-md text-[14px] text-primary placeholder-secondary transition-smooth focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[12px] text-secondary hover:text-primary"
            >
              {t('category_list.clear', 'Clear')}
            </button>
          )}
        </div>

      </div>

      {/* Kategori: 1 kolom di ponsel, 2 di tablet, 3 di desktop */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map((category) => {
          const isVideoAudio = category.id === 'video-audio';
          const CategoryIcon = isVideoAudio ? Video : ImageIcon;

          return (
            <div key={category.id} className="flex flex-col space-y-3">
              {/* Category Section Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center text-primary">
                    <CategoryIcon size={16} strokeWidth={1.75} />
                  </div>
                  <h2 className="text-[16px] font-semibold text-primary">
                    {category.label}
                  </h2>
                </div>
                <span className="text-[12px] font-medium text-secondary">
                  {t('category_list.tools_count', { count: category.tools.length, defaultValue: `${category.tools.length} Tools` })}
                </span>
              </div>

              {/* Tool List Items (acuan card list di section 3.7) */}
              <div className="flex flex-col space-y-2">
                {category.tools.map((tool) => {
                  const fromExt = tool.from?.[0]?.toUpperCase() || 'FILE';
                  const toExt = tool.to?.[0]?.toUpperCase() || 'FORMAT';

                  return (
                      <Link
                        key={tool.id}
                        to={`/${isCompressor ? 'compress' : 'convert'}/${tool.id}`}
                        className="group block"
                      >
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-smooth hover:border-blue-500">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Mini Icon Indicator */}
                          <div className="flex h-9 w-9 min-w-[36px] items-center justify-center rounded-md bg-card-muted text-secondary transition-colors group-hover:text-primary">
                            {tool.type === 'video' ? (
                              <Film size={17} strokeWidth={1.75} />
                            ) : tool.type === 'audio' ? (
                              <Music size={17} strokeWidth={1.75} />
                            ) : (
                              <ImageIcon size={17} strokeWidth={1.75} />
                            )}
                          </div>

                          {/* Tool Name & Description */}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-medium leading-[18px] text-primary">
                              {tool.label}
                            </p>
                            <p className="mt-0.5 truncate text-[12px] leading-[16px] text-secondary">
                              {tool.description || `Convert ${tool.from.join(', ')} to ${tool.to.join(', ')}`}
                            </p>
                          </div>
                        </div>

                        {/* Right: Badge / Arrow */}
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="hidden whitespace-nowrap rounded-sm bg-card-muted px-2 py-0.5 text-[11px] font-medium uppercase text-secondary sm:inline-block">
                            {tool.to.length === 1 ? tool.to[0] : `${tool.to.length} formats`}
                          </span>
                          <div className="flex h-7 w-7 items-center justify-center rounded-full text-tertiary transition-colors group-hover:text-blue-500">
                            <ArrowUpRight size={16} strokeWidth={1.75} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="col-span-full p-8 text-center bg-card border border-border rounded-lg">
            <p className="text-[14px] font-medium text-primary mb-1">
              {t('category_list.no_results', 'No tools found')}
            </p>
            <p className="text-[12px] text-secondary">
              {t('category_list.no_results_desc', { query: searchQuery, defaultValue: `No tools matching "${searchQuery}".` })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
