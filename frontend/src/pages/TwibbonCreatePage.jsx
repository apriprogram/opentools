import React, { useState, useRef } from 'react';
import { Upload, X, Camera, AlertTriangle, ArrowRight, ArrowLeft, Settings, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { login, getCurrentUser, createCampaign } from '../services/twibbonApi';

export default function TwibbonCreatePage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  
  const [step, setStep] = useState(1);
  const [frameSrc, setFrameSrc] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  const navigate = useNavigate();
  
  const [campaignDetails, setCampaignDetails] = useState({
    title: '',
    description: '',
    link: ''
  });

  const fileInputRef = useRef(null);

  const checkTransparency = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          let hasTransparentPixels = false;
          // Step by 4 to check Alpha channel, but we can jump pixels for speed if needed.
          // Standard size shouldn't block main thread too long.
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 250) { // Slight tolerance
              hasTransparentPixels = true;
              break;
            }
          }
          resolve({ hasTransparentPixels, src: e.target.result });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFile = async (file) => {
    if (!file || !file.type.includes('image')) return;
    
    // Check for transparency
    const result = await checkTransparency(file);
    setFrameSrc(result.src);
    
    if (!result.hasTransparentPixels) {
      setIsModalOpen(true);
    } else {
      setStep(2);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePublishClick = () => {
    if (!campaignDetails.title || !campaignDetails.link) {
      alert('Please fill in Campaign Title and Link');
      return;
    }
    const user = getCurrentUser();
    if (user) {
      setUserName(user.name || '');
      setUserEmail(user.email || '');
    }
    setIsAuthModalOpen(true);
  };

  const handleAuthSubmit = async () => {
    if (!userName?.trim() || !userEmail?.trim()) return;
    try {
      const user = await login(userName.trim(), userEmail.trim());
      setIsAuthModalOpen(false);
      executePublish(user.id);
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  };

  const executePublish = async (userId) => {
    try {
      setIsPublishing(true);
      const campaign = await createCampaign({
        title: campaignDetails.title,
        description: campaignDetails.description,
        slug: campaignDetails.link,
        frameBase64: frameSrc,
        creatorId: userId
      });
      // Show success overlay + toast
      setShowSuccess(true);
      addToast({
        type: 'success',
        title: 'Campaign berhasil dipublish! 🎉',
        message: `"${campaign.title}" sudah live dan bisa digunakan.`,
        duration: 4000,
      });
      setTimeout(() => {
        navigate(`/c/${campaign.slug}`);
      }, 1600);
    } catch (err) {
      addToast({ type: 'error', title: 'Gagal publish', message: err.message });
      setIsPublishing(false);
    }
  };

  // Success overlay
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[99998] flex flex-col items-center justify-center bg-page gap-6 animate-in fade-in duration-300">
        <div className="relative flex items-center justify-center">
          {/* Ripple rings */}
          <span className="absolute w-40 h-40 rounded-full bg-emerald-500/10 animate-ping" />
          <span className="absolute w-28 h-28 rounded-full bg-emerald-500/15 animate-ping [animation-delay:200ms]" />
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center animate-in zoom-in-50 duration-500">
            <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={1.75} />
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-primary">Campaign Berhasil!</p>
          <p className="text-sm text-secondary mt-1">Mengalihkan ke halaman campaign...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page flex flex-col pt-12">
      <div className="w-full px-4 sm:px-6 md:px-8 flex-1 pb-24">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="secondary" size="sm" icon={ArrowLeft}>
                {t('common.back', 'Kembali')}
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-primary">{t('twibbon.create_title', 'Frame Twibbon')}</h1>
          </div>
          <div className="flex items-center gap-3">
            {step === 2 && (
              <Button variant="secondary" size="sm" onClick={() => setStep(1)}>
                {t('twibbon.back_btn', 'Back')}
              </Button>
            )}
            <Button 
              variant="primary" 
              size="sm" 
              disabled={step === 1 || isPublishing}
              onClick={handlePublishClick}
            >
              {isPublishing ? t('twibbon.publishing', 'Publishing...') : t('twibbon.publish', 'Publish')}
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Preview / Upload */}
          <div className="w-full lg:w-1/2 flex flex-col">
            {step === 1 ? (
              // Step 1: Upload Zone
              <div 
                className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-colors cursor-pointer
                  ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-border bg-card hover:bg-card-muted'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-full bg-card-muted border border-border flex items-center justify-center mb-4">
                  <Upload size={24} className="text-secondary" />
                </div>
                <h3 className="text-lg font-medium text-primary mb-2">{t('twibbon.upload_title', 'Upload your design here')}</h3>
                <p className="text-sm text-secondary text-center">{t('twibbon.upload_desc', 'Type: PNG')}<br/>{t('twibbon.upload_desc2', 'Size: Maximum 5 MB')}<br/>{t('twibbon.upload_desc3', 'Recommendation: 1080x1080px')}</p>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/png, image/jpeg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            ) : (
              // Step 2: Mobile Preview
              <div className="flex items-center justify-center bg-card-muted border border-border rounded-2xl p-8 min-h-[600px]">
                {/* Mobile Phone Mockup */}
                <div className="relative w-[300px] h-[600px] bg-[#1a1a1c] dark:bg-card rounded-[40px] shadow-2xl overflow-hidden border-[6px] border-[#2c2c2e] dark:border-border flex flex-col">
                  {/* Top Bar Fake */}
                  <div className="h-12 w-full flex items-center justify-between px-6 pt-2">
                    <span className="font-bold text-white text-sm tracking-wide">twibbonize</span>
                  </div>
                  
                  {/* Content Area */}
                  <div className="flex-1 flex flex-col px-4 pt-4 pb-6 overflow-y-auto custom-scrollbar">
                    
                    <h2 className="text-center font-semibold text-lg text-white mb-1">
                      {campaignDetails.title || 'Campaign Title'}
                    </h2>
                    <p className="text-center text-xs text-gray-400 mb-6 flex items-center justify-center gap-1">
                      <Settings size={12}/> 0 supporters
                    </p>

                    {/* Frame Preview Container */}
                    <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-gradient-to-br from-orange-500 to-yellow-500 shadow-inner mb-6">
                       {/* Uploaded Frame Layer */}
                       {frameSrc && (
                         <img 
                           src={frameSrc} 
                           alt="Frame" 
                           className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none" 
                         />
                       )}
                       {/* Fake person placeholder could go here behind the frame */}
                       <div className="absolute inset-0 flex items-center justify-center opacity-50 mix-blend-overlay">
                          <ImageIcon size={48} className="text-white" />
                       </div>
                    </div>

                    <Button variant="primary" className="w-full rounded-full bg-teal-500 hover:bg-teal-600 border-none text-white font-medium shadow-lg" icon={Camera}>
                      {t('twibbon.choose_photo', 'Choose Your Photo')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Form */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
                <Settings size={16} /> {t('twibbon.campaign_details', 'Campaign Details')}
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-secondary mb-1.5">Campaign Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hut RI ke74"
                    value={campaignDetails.title}
                    onChange={(e) => setCampaignDetails(prev => ({...prev, title: e.target.value}))}
                    className="w-full bg-page border border-border rounded-lg px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-[13px] font-medium text-secondary mb-1.5">{t('twibbon.desc_label', 'Description (Optional)')}</label>
                  <textarea 
                    placeholder={t('twibbon.desc_placeholder', 'Share details about your campaign...')}
                    value={campaignDetails.description}
                    onChange={(e) => setCampaignDetails(prev => ({...prev, description: e.target.value}))}
                    rows={4}
                    className="w-full bg-page border border-border rounded-lg px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-secondary mb-1.5">Campaign Link</label>
                  <div className="flex bg-page border border-border rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
                    <span className="px-3 py-2.5 bg-card-muted border-r border-border text-sm text-secondary select-none">
                      localhost:5173/c/
                    </span>
                    <input 
                      type="text" 
                      placeholder="campaign-link"
                      value={campaignDetails.link}
                      onChange={(e) => setCampaignDetails(prev => ({...prev, link: e.target.value}))}
                      className="flex-1 bg-transparent px-3 py-2.5 text-sm text-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal for No Transparency */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        maxWidth="max-w-[400px]"
      >
        <div className="flex flex-col items-center justify-center pt-4 pb-2">
           <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
             <AlertTriangle size={32} />
           </div>
           <h2 className="text-xl font-bold text-primary mb-3 text-center">No transparent area detected on your image</h2>
           <p className="text-sm text-secondary text-center leading-relaxed">
             This means that there is no hole on your frame. You can easily create a hole with a background remover or editor.
           </p>
           
           <div className="w-full mt-6">
             <Button 
               variant="primary" 
               className="w-full justify-center bg-teal-500 hover:bg-teal-600 border-none rounded-full"
               onClick={() => {
                 setIsModalOpen(false);
                 setStep(2);
               }}
             >
               Next <ArrowRight size={16} className="ml-1" />
             </Button>
           </div>
        </div>
      </Modal>

      {/* Modal for Auth */}
      <Modal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        maxWidth="max-w-[400px]"
      >
        <div className="flex flex-col pt-4 pb-2">
           <h2 className="text-xl font-bold text-primary mb-2">Welcome!</h2>
           <p className="text-sm text-secondary mb-6">
             Please enter your name and email to create an account and publish your campaign.
           </p>
           
           <input 
             type="text" 
             placeholder="Your Name"
             value={userName}
             onChange={(e) => setUserName(e.target.value)}
             className="w-full bg-page border border-border rounded-lg px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-blue-500 transition-colors mb-3"
           />

           <input 
             type="email" 
             placeholder="Your Email"
             value={userEmail}
             onChange={(e) => setUserEmail(e.target.value)}
             className="w-full bg-page border border-border rounded-lg px-3 py-2.5 text-sm text-primary focus:outline-none focus:border-blue-500 transition-colors mb-6"
           />

           <div className="w-full flex justify-end gap-3">
             <Button variant="secondary" onClick={() => setIsAuthModalOpen(false)}>Cancel</Button>
             <Button variant="primary" onClick={handleAuthSubmit} disabled={!userName?.trim() || !userEmail?.trim()}>Continue</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
}
