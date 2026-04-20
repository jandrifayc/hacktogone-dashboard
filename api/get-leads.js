const { Client } = require('@notionhq/client');

export default async function handler(req, res) {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_DB_CONTACTS) {
    return res.status(500).json({ error: "Missing environment variables" });
  }

  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DB_CONTACTS,
    });

    const leads = response.results.map(page => {
      const p = page.properties;
      const getP = (names) => {
        for (let n of names) {
          if (p[n]) {
            if (p[n].title) return p[n].title[0]?.plain_text || '';
            if (p[n].rich_text) return p[n].rich_text[0]?.plain_text || '';
            if (p[n].select) return p[n].select.name || '';
            if (p[n].number) return p[n].number;
            if (p[n].email) return p[n].email;
            if (p[n].url) return p[n].url;
            if (p[n].phone_number) return p[n].phone_number;
          }
        }
        return '';
      };

      return {
        id: page.id,
        nom_complet: getP(['Nom', 'Contact Name']) || 'Inconnu',
        prenom: (getP(['Nom', 'Contact Name']) || '').split(' ')[0],
        nom: (getP(['Nom', 'Contact Name']) || '').split(' ').slice(1).join(' '),
        email: getP(['Email', 'Courriel']),
        entreprise: getP(['Entreprise', 'Company']),
        secteur: getP(['Vertical', 'Secteur']),
        priorite: getP(['Priorité', 'hacktogone_priority']) || 'B',
        statut: getP(['Statut', 'Status']) || 'New',
        score: getP(['Score']) || 5,
        pain: getP(['PainPoint', 'Pain']),
        linkedin: getP(['LinkedIn', 'Linkedin URL']),
        telephone: getP(['Téléphone', 'Tel']),
        website: getP(['Site', 'Website'])
      };
    });

    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
