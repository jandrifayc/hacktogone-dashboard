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
      // Mapping robuste : on cherche plusieurs noms de propriétés possibles
      const getVal = (propNames) => {
        for (let name of propNames) {
          if (p[name]) {
            if (p[name].rich_text) return p[name].rich_text[0]?.plain_text || '';
            if (p[name].title) return p[name].title[0]?.plain_text || '';
            if (p[name].select) return p[name].select.name || '';
            if (p[name].number) return p[name].number;
            if (p[name].email) return p[name].email;
            if (p[name].url) return p[name].url;
            if (p[name].phone_number) return p[name].phone_number;
          }
        }
        return '';
      };

      const nomComplet = getVal(['Nom', 'Contact Name']);
      return {
        id: page.id,
        nom_complet: nomComplet,
        prenom: nomComplet.split(' ')[0] || '',
        nom: nomComplet.split(' ').slice(1).join(' ') || '',
        email: getVal(['Email', 'Courriel']),
        telephone: getVal(['Téléphone', 'Tel', 'Phone']),
        entreprise: getVal(['Entreprise', 'Company', 'Société']),
        titre: getVal(['Poste', 'Job Title', 'Titre']),
        secteur: getVal(['Vertical', 'Secteur', 'Secteur d\'activité']),
        priorite: getVal(['Priorité', 'hacktogone_priority', 'Prio']) || 'B',
        score: getVal(['Score', 'Score Hacktogone']) || 5,
        pain: getVal(['PainPoint', 'Pain', 'Défi IA']),
        statut: getVal(['Statut', 'Status']) || 'New',
        linkedin: getVal(['LinkedIn', 'Linkedin URL']),
        ville: getVal(['Ville', 'City']) || 'Paris',
        region: getVal(['Région', 'Region']) || 'National',
        website: getVal(['Site', 'Website', 'Site Web'])
      };
    });

    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
