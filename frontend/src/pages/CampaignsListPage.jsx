import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { getCampaigns, getCurrentUser, deleteCampaign } from '../services/twibbonApi';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Plus, ImagePlus, Search, Eye, Download, Trash2, AlertTriangle, X, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CampaignsListPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, campaignId: null });
  const [currentUser, setCurrentUser] = useState(null);
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const data = await getCampaigns();
        setCampaigns(data || []);
      } catch (err) {
        console.error('Failed to fetch campaigns', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const handleDeleteClick = (e, id) => {
    e.preventDefault();
    setDeleteModal({ isOpen: true, campaignId: id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.campaignId) return;
    if (!isLocalhost && !currentUser) return;
    
    try {
      await deleteCampaign(deleteModal.campaignId, currentUser?.id || 'localhost-admin');
      setCampaigns(campaigns.filter(c => c.id !== deleteModal.campaignId));
      setDeleteModal({ isOpen: false, campaignId: null });
      addToast({ type: 'success', title: 'Campaign dihapus', message: 'Campaign berhasil dihapus.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Gagal menghapus', message: err.message });
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, campaignId: null });
  };

  return (
    <PageContainer>
      <div className="py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-primary mb-2">{t('twibbon.campaigns_title', 'Twibbon Campaigns')}</h1>
              <p className="text-secondary text-sm">{t('twibbon.campaigns_desc', 'Explore and join various twibbon campaigns created by our community.')}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/">
                <Button variant="secondary" icon={ArrowLeft}>{t('common.back', 'Kembali')}</Button>
              </Link>
              <Link to="/twibbon/create">
                <Button variant="primary" icon={Plus}>{t('twibbon.create_btn', 'Create Campaign')}</Button>
              </Link>
            </div>
          </div>
          
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
            <input 
              type="text" 
              placeholder={t('twibbon.search_campaigns', 'Search campaigns...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-primary focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-xl">
            <div className="w-16 h-16 bg-card-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ImagePlus size={32} className="text-secondary" />
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">{t('twibbon.no_campaigns', 'No Campaigns Yet')}</h2>
            <p className="text-secondary mb-6">{t('twibbon.no_campaigns_desc', 'Be the first to create an amazing twibbon campaign!')}</p>
            <Link to="/twibbon/create">
              <Button variant="primary">{t('twibbon.create_now', 'Create Now')}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {campaigns
              .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || (c.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
              .map(campaign => (
              <Link 
                key={campaign.id} 
                to={`/c/${campaign.slug}`}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:border-teal-500/50 transition-all hover:shadow-lg flex flex-col"
              >
                <div className="w-full aspect-square relative bg-card-muted overflow-hidden">
                  {campaign.frameBase64 ? (
                    <img 
                      src={campaign.frameBase64} 
                      alt={campaign.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImagePlus size={24} className="text-secondary/50" />
                    </div>
                  )}
                </div>
                
                <div className="p-3 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-sm text-primary group-hover:text-teal-500 transition-colors line-clamp-2 flex-1">
                      {campaign.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-secondary shrink-0 mt-0.5">
                      <div className="flex items-center gap-1" title={t('twibbon.views', 'Views')}>
                        <Eye size={12} /> <span>{campaign.views || 0}</span>
                      </div>
                      <div className="flex items-center gap-1" title={t('twibbon.downloads', 'Downloads')}>
                        <Download size={12} /> <span>{campaign.usage || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-secondary line-clamp-2 mb-3 flex-1">
                    {campaign.description || t('twibbon.no_description', 'No description')}
                  </p>
                  
                  <div className="text-[10px] text-secondary mt-auto pt-2 border-t border-border flex justify-between items-center">
                    <span className="truncate mr-2">{campaign.creatorName || t('twibbon.anonymous', 'Anonymous')}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                      {/* Show delete for own campaigns, or ALL campaigns on localhost */}
                      {(isLocalhost || currentUser?.id === campaign.creatorId) && (
                        <button 
                          onClick={(e) => handleDeleteClick(e, campaign.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          title={t('twibbon.delete_campaign', 'Delete Campaign')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal via Portal */}
      {deleteModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={cancelDelete}
              className="absolute right-4 top-4 text-secondary hover:text-primary transition-colors"
            >
              <X size={20} />
            </button>
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-primary mb-2">{t('twibbon.delete_confirm_title', 'Delete Campaign?')}</h3>
            <p className="text-secondary text-sm mb-6">
              {t('twibbon.delete_confirm_desc', 'Are you sure you want to delete this campaign? This action cannot be undone and all associated data will be lost.')}
            </p>
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={cancelDelete}
                className="flex-1 border border-border bg-card hover:bg-card-muted text-primary font-medium h-[40px] px-4 rounded-xl transition-colors text-sm"
              >
                {t('twibbon.cancel', 'Cancel')}
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium h-[40px] px-4 rounded-xl transition-colors text-sm"
              >
                {t('twibbon.delete', 'Delete')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </PageContainer>
  );
}
