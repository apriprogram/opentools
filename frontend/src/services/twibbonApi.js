const API_BASE = 'http://localhost:5000/api/v1/twibbon';

export const login = async (name, email) => {
  const res = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email })
  });
  const data = await res.json();
  if (data.success && data.user) {
    localStorage.setItem('twibbon_user', JSON.stringify(data.user));
    return data.user;
  }
  throw new Error(data.message || 'Login failed');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('twibbon_user');
  return user ? JSON.parse(user) : null;
};

export const createCampaign = async (campaignData) => {
  const res = await fetch(`${API_BASE}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(campaignData)
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Create campaign failed');
  return data.campaign;
};

export const getCampaigns = async () => {
  const res = await fetch(`${API_BASE}/campaigns`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Fetch campaigns failed');
  return data.campaigns;
};

export const getCampaignBySlug = async (slug) => {
  const res = await fetch(`${API_BASE}/campaigns/${slug}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Campaign not found');
  return data.campaign;
};

export const trackCampaignView = async (id) => {
  const res = await fetch(`${API_BASE}/campaigns/${id}/view`, { method: 'POST' });
  const data = await res.json();
  return data.success;
};

export const trackCampaignUsage = async (id) => {
  const res = await fetch(`${API_BASE}/campaigns/${id}/usage`, { method: 'POST' });
  const data = await res.json();
  return data.success;
};

export const deleteCampaign = async (id, creatorId) => {
  const res = await fetch(`${API_BASE}/campaigns/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creatorId })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to delete campaign');
  return data.success;
};
