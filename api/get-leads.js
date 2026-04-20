const { Client } = require('@notionhq/client');

module.exports = async (req, res) => {
  // Activation CORS pour le dashboard
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.NOTION_TOKEN;
  const dbId = process.env.NOTION_DB_CONTACTS;

  if (!token || !dbId) {
    return res.status(200).json({ error: "Variables NOTION_TOKEN ou NOTION_DB_CONTACTS manquantes dans Vercel." });
  }

  const notion = new Client({ auth: token });

  try {
    const response = await notion.databases.query({ database_id: dbId });

    const leads = response.results.map(page => {
      const p = page.properties;
      
      // Fonction utilitaire ultra-robuste pour extraire les données
      const getVal = (propName) => {
        const prop = p[propName];
        if (!prop) return '';
        try {
          if (prop.title) return prop.title[0]?.plain_text || '';
          if (prop.rich_text) return prop.rich_text[0]?.plain_text || '';
          if (prop.select) return prop.select.name || '';
          if (prop.number) return String(prop.number || '0');
          if (prop.email) return prop.email || '';
          if (prop.url) return prop.url || '';
          if (prop.phone_number) return prop.phone_number || '';
        } catch (e) { return ''; }
        return '';
      };

      const fullName = getVal('Nom') || 'Inconnu';
      return {
        id: page.id,
        nom_complet: fullName,
        prenom: fullName.split(' ')[0],
        nom: fullName.split(' ').slice(1).join(' '),
        email: getVal('Email'),
        entreprise: getVal('Entreprise'),
        secteur: getVal('Vertical') || getVal('Secteur') || '—',
        priorite: getVal('Priorité') || 'B',
        statut: getVal('Statut') || 'New',
        score: getVal('Score') || '5',
        pain: getVal('PainPoint') || getVal('Pain') || '',
        linkedin: getVal('LinkedIn'),
        telephone: getVal('Téléphone') || getVal('Tel') || '',
        website: getVal('Site') || getVal('Website') || '',
        ville: getVal('Ville') || 'Paris',
        region: getVal('Région') || 'National'
      };
    });

    return res.status(200).json(leads);
  } catch (error) {
    console.error(error);
    return res.status(200).json({ 
      error: "Impossible de joindre Notion", 
      details: error.message 
    });
  }
};
