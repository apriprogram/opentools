import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCampaignBySlug, trackCampaignView, trackCampaignUsage } from '../services/twibbonApi';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import { Camera, Settings, Image as ImageIcon, ArrowLeft, ZoomIn, ZoomOut, FlipHorizontal, FlipVertical, Eye, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TwibbonViewPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPhoto, setUserPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Image adjustment states
  const [zoom, setZoom] = useState(1);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    let isViewTracked = false;
    const fetchCampaign = async () => {
      try {
        const data = await getCampaignBySlug(slug);
        setCampaign(data);
        if (data?.id && !isViewTracked) {
          trackCampaignView(data.id).catch(console.error);
          isViewTracked = true;
        }
      } catch (err) {
        console.error('Failed to fetch campaign', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [slug]);

  const handlePhotoUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserPhoto(e.target.result);
        setZoom(1);
        setFlipH(false);
        setFlipV(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!userPhoto || !campaign?.frameBase64) return;
    setIsProcessing(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set a high resolution for the output
    canvas.width = 1080;
    canvas.height = 1080;

    const userImg = new Image();
    const frameImg = new Image();

    userImg.onload = () => {
      // Crop user image to a square and draw it covering the background
      const size = Math.min(userImg.width, userImg.height);
      const startX = (userImg.width - size) / 2;
      const startY = (userImg.height - size) / 2;
      
      // Draw white background in case user image has transparency
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      // Translate to center to apply transforms
      ctx.translate(canvas.width / 2, canvas.height / 2);
      
      // Apply transforms
      ctx.scale(zoom, zoom);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      
      // Draw user photo (shifted back by half width/height so it centers)
      ctx.drawImage(
        userImg, 
        startX, startY, size, size, 
        -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height
      );
      ctx.restore();
      
      frameImg.onload = () => {
        // Draw Twibbon frame on top
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
        
        // Export to JPG
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = `twibbon-${campaign.slug}.jpg`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Track usage
        trackCampaignUsage(campaign.id).catch(console.error);
        
        setIsProcessing(false);
      };
      frameImg.src = campaign.frameBase64;
    };
    userImg.src = userPhoto;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-page px-4">
        <h1 className="text-2xl font-bold text-primary mb-2">{t('twibbon.not_found_title', 'Campaign Not Found')}</h1>
        <p className="text-secondary mb-6">{t('twibbon.not_found_desc', 'The campaign you are looking for does not exist or has been removed.')}</p>
        <Link to="/campaigns">
          <Button variant="primary">{t('twibbon.browse_campaigns', 'Browse Campaigns')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page pt-12 pb-24 flex justify-center px-4">
      <div className="w-full max-w-4xl flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-6 self-start md:px-8 lg:px-24">
          <Link to="/campaigns" className="text-secondary hover:text-primary flex items-center gap-2">
            <ArrowLeft size={16} /> {t('twibbon.back_to_campaigns', 'Back to Campaigns')}
          </Link>
          <Link to="/">
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              {t('common.back', 'Kembali')}
            </Button>
          </Link>
        </div>

        <div className="w-full flex flex-col md:flex-row gap-6 justify-center items-center md:items-start">
          
          {/* Tools Panel - Top on mobile, Left on desktop */}
          {userPhoto && (
            <div className="flex md:flex-col gap-2 bg-[#1a1a1c] dark:bg-card px-4 py-2 md:py-4 md:px-2 rounded-full border border-[#2c2c2e] dark:border-border shadow-lg order-1 md:order-none z-10 w-fit overflow-x-auto mx-auto md:mx-0">
              
              <button 
                onClick={() => setZoom(z => Math.min(z + 0.1, 3))}
                className="flex items-center justify-center p-3 rounded-full bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white transition-colors flex-shrink-0"
                title={t('twibbon.zoom_in', 'Zoom In')}
              >
                <ZoomIn size={20} />
              </button>
              <button 
                onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))}
                className="flex items-center justify-center p-3 rounded-full bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white transition-colors flex-shrink-0"
                title={t('twibbon.zoom_out', 'Zoom Out')}
              >
                <ZoomOut size={20} />
              </button>
              
              <div className="w-px h-auto md:w-auto md:h-px bg-gray-700 my-1"></div>
              
              <button 
                onClick={() => setFlipH(!flipH)}
                className="flex items-center justify-center p-3 rounded-full bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white transition-colors flex-shrink-0"
                title={t('twibbon.flip_horizontal', 'Flip Horizontal')}
              >
                <FlipHorizontal size={20} />
              </button>
              <button 
                onClick={() => setFlipV(!flipV)}
                className="flex items-center justify-center p-3 rounded-full bg-[#2c2c2e] hover:bg-[#3c3c3e] text-white transition-colors flex-shrink-0"
                title={t('twibbon.flip_vertical', 'Flip Vertical')}
              >
                <FlipVertical size={20} />
              </button>
            </div>
          )}

          {/* Mobile Phone Mockup */}
          <div className="relative w-full aspect-[1/2] max-h-[700px] bg-[#1a1a1c] dark:bg-card rounded-[40px] shadow-2xl overflow-hidden border-[6px] border-[#2c2c2e] dark:border-border flex flex-col sm:w-[350px] order-2 md:order-none">
          {/* Top Bar Fake */}
          <div className="h-12 w-full flex items-center justify-between px-6 pt-2">
            <span className="font-bold text-white text-sm tracking-wide">twibbonize</span>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 flex flex-col px-4 pt-4 pb-6 overflow-y-auto custom-scrollbar">
            
            <h2 className="text-center font-semibold text-xl text-white mb-1">
              {campaign.title}
            </h2>
            <div className="flex items-center justify-center gap-4 mb-6 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Settings size={12}/> {t('twibbon.by', 'by')} {campaign.creatorName || t('twibbon.anonymous', 'Anonymous')}
              </span>
              <span className="flex items-center gap-1" title={t('twibbon.views', 'Views')}>
                <Eye size={12} /> {campaign.views || 0}
              </span>
              <span className="flex items-center gap-1" title={t('twibbon.downloads', 'Downloads')}>
                <Download size={12} /> {campaign.usage || 0}
              </span>
            </div>

            {/* Frame Preview Container */}
            <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-gradient-to-br from-orange-500 to-yellow-500 shadow-inner mb-6 flex items-center justify-center">
                {/* User Photo behind the frame */}
                {userPhoto ? (
                  <img 
                    src={userPhoto} 
                    alt="User" 
                    className="absolute inset-0 w-full h-full object-cover z-0 origin-center" 
                    style={{
                      transform: `scale(${zoom}) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                      transition: 'transform 0.1s ease-out'
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-50 mix-blend-overlay z-0">
                    <ImageIcon size={48} className="text-white" />
                  </div>
                )}
                
                {/* Uploaded Frame Layer */}
                {campaign.frameBase64 && (
                  <img 
                    src={campaign.frameBase64} 
                    alt="Frame" 
                    className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" 
                  />
                )}
            </div>

            <p className="text-sm text-gray-300 text-center mb-6 px-2 leading-relaxed">
              {campaign.description}
            </p>

            <div className="mt-auto flex flex-col gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoUpload}
              />
              
              {userPhoto ? (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-full border-gray-600 text-gray-300 hover:bg-gray-800" 
                    icon={Camera}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('twibbon.change_photo', 'Change Photo')}
                  </Button>
                  <Button 
                    variant="primary" 
                    className="w-full rounded-full bg-teal-500 hover:bg-teal-600 border-none text-white font-medium shadow-lg" 
                    onClick={handleDownload}
                    disabled={isProcessing}
                  >
                    {isProcessing ? t('twibbon.processing', 'Processing...') : t('twibbon.download', 'Download')}
                  </Button>
                </>
              ) : (
                <Button 
                  variant="primary" 
                  className="w-full rounded-full bg-teal-500 hover:bg-teal-600 border-none text-white font-medium shadow-lg" 
                  icon={Camera}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('twibbon.choose_photo', 'Choose Your Photo')}
                </Button>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
