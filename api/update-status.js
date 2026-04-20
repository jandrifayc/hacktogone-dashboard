const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { pageId, status } = req.body;

  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Statut': {
          select: { name: status }
        }
      }
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
