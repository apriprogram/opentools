import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../../data');
const dbFile = path.join(dataDir, 'twibbon.json');

// Ensure data dir and file exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({ users: [], campaigns: [] }, null, 2));
}

const readDB = () => {
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading twibbon DB:', error);
    return { users: [], campaigns: [] };
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing twibbon DB:', error);
  }
};

export const loginUser = (name, email) => {
  const db = readDB();
  let user = db.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      name,
      email,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
    writeDB(db);
  }
  
  return user;
};

export const createCampaign = (campaignData) => {
  const db = readDB();
  
  // Ensure slug is unique
  let finalSlug = campaignData.slug;
  let counter = 1;
  while (db.campaigns.some(c => c.slug === finalSlug)) {
    finalSlug = `${campaignData.slug}-${counter}`;
    counter++;
  }

  const campaign = {
    id: crypto.randomUUID(),
    slug: finalSlug,
    title: campaignData.title,
    description: campaignData.description || '',
    frameBase64: campaignData.frameBase64,
    creatorId: campaignData.creatorId,
    createdAt: new Date().toISOString(),
    views: 0,
    usage: 0
  };

  db.campaigns.push(campaign);
  writeDB(db);

  return campaign;
};

export const getAllCampaigns = () => {
  const db = readDB();
  return db.campaigns.map(c => {
    const creator = db.users.find(u => u.id === c.creatorId);
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      creatorId: c.creatorId,
      creatorName: creator ? creator.name : 'Unknown',
      createdAt: c.createdAt,
      views: c.views || 0,
      usage: c.usage || 0,
      frameBase64: c.frameBase64 // Added to display in campaign cards
    };
  });
};

export const getCampaignBySlug = (slug) => {
  const db = readDB();
  const campaign = db.campaigns.find(c => c.slug === slug);
  if (!campaign) return null;
  
  const creator = db.users.find(u => u.id === campaign.creatorId);
  return {
    ...campaign,
    views: campaign.views || 0,
    usage: campaign.usage || 0,
    creatorName: creator ? creator.name : 'Unknown'
  };
};

export const trackCampaignView = (id) => {
  const db = readDB();
  const campaign = db.campaigns.find(c => c.id === id);
  if (campaign) {
    campaign.views = (campaign.views || 0) + 1;
    writeDB(db);
    return true;
  }
  return false;
};

export const trackCampaignUsage = (id) => {
  const db = readDB();
  const campaign = db.campaigns.find(c => c.id === id);
  if (campaign) {
    campaign.usage = (campaign.usage || 0) + 1;
    writeDB(db);
    return true;
  }
  return false;
};

export const deleteCampaign = (id, creatorId) => {
  const db = readDB();
  const index = db.campaigns.findIndex(c => c.id === id && c.creatorId === creatorId);
  if (index !== -1) {
    db.campaigns.splice(index, 1);
    writeDB(db);
    return true;
  }
  return false;
};

// Admin/localhost only: delete by id without creatorId check
export const deleteCampaignById = (id) => {
  const db = readDB();
  const index = db.campaigns.findIndex(c => c.id === id);
  if (index !== -1) {
    db.campaigns.splice(index, 1);
    writeDB(db);
    return true;
  }
  return false;
};

