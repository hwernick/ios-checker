import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import plist from 'plist';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API endpoint called');
  
  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm({ 
    uploadDir: './uploads', 
    keepExtensions: true 
  });

  form.parse(req, async (err, fields: Fields, files: Files) => {
    console.log('Form parsing completed');
    console.log('Fields:', fields);
    console.log('Files:', files);

    if (err) {
      console.error('Form parsing error:', err);
      return res.status(400).json({ error: 'File upload failed', details: err.message });
    }

    const file = files.file;
    if (!file) {
      console.log('No file received');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadedFile = Array.isArray(file) ? file[0] : file;
    const uploadedFilePath = uploadedFile.filepath;

    console.log('Processing file at:', uploadedFilePath);

    try {
      const zip = new AdmZip(uploadedFilePath);
      const entries = zip.getEntries();
      console.log('Found entries in zip:', entries.length);

      const plistEntry = entries.find(entry => entry.entryName.endsWith('Info.plist'));
      if (!plistEntry) {
        console.log('Info.plist not found in archive');
        return res.status(400).json({ error: 'Info.plist not found in archive' });
      }

      const plistData = plist.parse(plistEntry.getData().toString('utf8'));
      console.log('Parsed plist data');

      const rules = JSON.parse(fs.readFileSync(path.resolve('./rules.json'), 'utf8'));
      console.log('Loaded rules:', rules.length);

      const results = rules.map((rule: any) => {
        const hasKey = plistData.hasOwnProperty(rule.key);
        return {
          id: rule.id,
          description: rule.description,
          key: rule.key,
          passed: hasKey,
          severity: rule.severity,
          section: rule.section || 'Other',
        };
      });

      console.log('Analysis complete, sending results');
      res.status(200).json({ success: true, results });
    } catch (error: any) {
      console.error('Error processing file:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to analyze app file', 
        details: error?.message || 'Unknown error' 
      });
    }
  });
}
