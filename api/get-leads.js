const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = process.env.NOTION_DB_CONTACTS;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ property: 'Nom', direction: 'ascending' }],
    });

    const leads = response.results.map(page => {
      const p = page.properties;
      return {
        id: page.id,
        nom_complet: p.Nom.title[0]?.plain_text || 'Inconnu',
        prenom: p.Nom.title[0]?.plain_text.split(' ')[0] || '',
        nom: p.Nom.title[0]?.plain_text.split(' ').slice(1).join(' ') || '',
        email: p.Email?.email || '',
        telephone: p.Téléphone?.phone_number || p.Tel?.rich_text[0]?.plain_text || '',
        entreprise: p.Entreprise?.rich_text[0]?.plain_text || '—',
        titre: p.Poste?.rich_text[0]?.plain_text || '',
        secteur: p.Vertical?.rich_text[0]?.plain_text || p.Secteur?.rich_text[0]?.plain_text || '—',
        priorite: p.Priorité?.select?.name || p.hacktogone_priority?.select?.name || 'B',
        score: p.Score?.number || 5,
        pain: p.PainPoint?.rich_text[0]?.plain_text || p.Pain?.rich_text[0]?.plain_text || '',
        statut: p.Statut?.select?.name || 'New',
        linkedin: p.LinkedIn?.url || '',
        ville: p.Ville?.rich_text[0]?.plain_text || 'Paris',
        region: p.Région?.rich_text[0]?.plain_text || 'National',
        website: p.Site?.url || p.Website?.url || ''
      };
    });

    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
