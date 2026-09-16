import * as twibbonService from '../services/twibbon.service.js';

export const login = (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || name.trim() === '' || !email || email.trim() === '') {
      return res.status(400).json({ success: false, message: 'Name and Email are required' });
    }
    
    const user = twibbonService.loginUser(name.trim(), email.trim());
    res.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createCampaign = (req, res) => {
  try {
    const { title, description, slug, frameBase64, creatorId } = req.body;
    
    if (!title || !slug || !frameBase64 || !creatorId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const campaign = twibbonService.createCampaign({
      title,
      description,
      slug,
      frameBase64,
      creatorId
    });

    res.status(201).json({ success: true, campaign });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getAllCampaigns = (req, res) => {
  try {
    const campaigns = twibbonService.getAllCampaigns();
    res.json({ success: true, campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCampaign = (req, res) => {
  try {
    const { slug } = req.params;
    const campaign = twibbonService.getCampaignBySlug(slug);
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    
    res.json({ success: true, campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const trackView = (req, res) => {
  try {
    const { id } = req.params;
    const success = twibbonService.trackCampaignView(id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Campaign not found' });
    }
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const trackUsage = (req, res) => {
  try {
    const { id } = req.params;
    const success = twibbonService.trackCampaignUsage(id);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Campaign not found' });
    }
  } catch (error) {
    console.error('Track usage error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteCampaign = (req, res) => {
  try {
    const { id } = req.params;
    const { creatorId } = req.body;

    // Local admin mode: requests from localhost can delete any campaign
    const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1' || req.ip === '::1' || req.ip === '127.0.0.1';
    
    if (!creatorId && !isLocalhost) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const success = isLocalhost
      ? twibbonService.deleteCampaignById(id)      // admin: delete by id only
      : twibbonService.deleteCampaign(id, creatorId); // normal: must match creatorId

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Campaign not found' });
    }
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
