import crypto from "crypto";
import { query } from "../db/mysql.js";

const iso = (value) => (value instanceof Date ? value.toISOString() : value);

const toCampaign = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description || "",
  frameBase64: row.frame_base64,
  creatorId: row.creator_id,
  creatorName: row.creator_name || "Unknown",
  createdAt: iso(row.created_at),
  views: Number(row.views) || 0,
  usage: Number(row.usage_count) || 0
});

export const loginUser = async (name, email) => {
  const existing = await query(
    "SELECT id, name, email, created_at FROM twibbon_users WHERE LOWER(email) = LOWER(?) LIMIT 1",
    [email]
  );
  if (existing.length) {
    const u = existing[0];
    return { id: u.id, name: u.name, email: u.email, createdAt: iso(u.created_at) };
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: new Date().toISOString()
  };
  await query(
    "INSERT INTO twibbon_users (id, name, email, created_at) VALUES (?, ?, ?, ?)",
    [user.id, user.name, user.email, new Date(user.createdAt)]
  );
  return user;
};

const uniqueSlug = async (base) => {
  let candidate = base;
  let counter = 1;
  while (true) {
    const rows = await query("SELECT id FROM twibbon_campaigns WHERE slug = ? LIMIT 1", [candidate]);
    if (!rows.length) return candidate;
    candidate = `${base}-${counter}`;
    counter++;
  }
};

export const createCampaign = async (campaignData) => {
  const slug = await uniqueSlug(campaignData.slug);
  const campaign = {
    id: crypto.randomUUID(),
    slug,
    title: campaignData.title,
    description: campaignData.description || "",
    frameBase64: campaignData.frameBase64,
    creatorId: campaignData.creatorId,
    createdAt: new Date().toISOString(),
    views: 0,
    usage: 0
  };

  await query(
    `INSERT INTO twibbon_campaigns
      (id, slug, title, description, frame_base64, creator_id, views, usage_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)`,
    [
      campaign.id,
      campaign.slug,
      campaign.title,
      campaign.description,
      campaign.frameBase64,
      campaign.creatorId,
      new Date(campaign.createdAt)
    ]
  );
  return campaign;
};

const selectCampaigns = `
  SELECT c.id, c.slug, c.title, c.description, c.frame_base64, c.creator_id,
         c.views, c.usage_count, c.created_at, u.name AS creator_name
  FROM twibbon_campaigns c
  LEFT JOIN twibbon_users u ON u.id = c.creator_id`;

export const getAllCampaigns = async () => {
  const rows = await query(`${selectCampaigns} ORDER BY c.created_at ASC`);
  return rows.map(toCampaign);
};

export const getCampaignBySlug = async (slug) => {
  const rows = await query(`${selectCampaigns} WHERE c.slug = ? LIMIT 1`, [slug]);
  return rows.length ? toCampaign(rows[0]) : null;
};

export const trackCampaignView = async (id) => {
  const result = await query("UPDATE twibbon_campaigns SET views = views + 1 WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

export const trackCampaignUsage = async (id) => {
  const result = await query("UPDATE twibbon_campaigns SET usage_count = usage_count + 1 WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

export const deleteCampaign = async (id, creatorId) => {
  const result = await query("DELETE FROM twibbon_campaigns WHERE id = ? AND creator_id = ?", [id, creatorId]);
  return result.affectedRows > 0;
};

// Admin/localhost only: delete by id without creatorId check
export const deleteCampaignById = async (id) => {
  const result = await query("DELETE FROM twibbon_campaigns WHERE id = ?", [id]);
  return result.affectedRows > 0;
};
