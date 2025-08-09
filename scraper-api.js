import express from 'express';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

puppeteer.use(StealthPlugin());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// membagi request menjadi 4 batch
function chunkArray(arr, size) {
  return arr.reduce((chunks, item, i) => {
    if (i % size === 0) chunks.push([]);
    chunks[chunks.length - 1].push(item);
    return chunks;
  }, []);
}

// deskripsi ai
async function extractDataWithAI(items) {
  const prompt = `
Buat deskripsi singkat untuk setiap produk berikut.
Format output:
[
  { "title": "...", "price": "...", "description": "..." }
]

Data:
${JSON.stringify(items)}
  `;

  const completion = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt
  });

  return JSON.parse(completion.output[0].content[0].text);
}
// pagination
app.get('/scrape', async (req, res) => {
  try {
    const { pages = "1", keyword = "nike" } = req.query;
    const pageNumbers = pages.split(',').map(p => parseInt(p.trim(), 10));

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    let finalData = [];

    for (const pageNum of pageNumbers) {
      console.log(`Mengambil Data Halaman ${pageNum}...`);
      console.log(`Mengambil Data Pencarian ${keyword}...`);
      await page.goto(`https://www.ebay.com.sg/sch/i.html?_nkw=${encodeURIComponent(keyword)}&_sacat=0&_from=R40&_trksid=m570.l1313&_pgn=${pageNum}`, {
        waitUntil: 'networkidle2'
      });

      const products = await page.$$eval('.s-item', items =>
        items.map(item => ({
          title: item.querySelector('.s-item__title')?.innerText || '',
          price: item.querySelector('.s-item__price')?.innerText || '',
        }))
      );

      console.log(`Halaman ${pageNum} → ${products.length} produk ditemukan`);

      const batches = chunkArray(products, 20);

      for (let i = 0; i < batches.length; i++) {
        console.log(`Memproses batch ${i + 1} dari ${batches.length} (halaman ${pageNum})...`);
        try {
          const dataWithDesc = await extractDataWithAI(batches[i]);
          finalData = finalData.concat(dataWithDesc);
        } catch (err) {
          console.error(`Error batch ${i + 1}:`, err.message);
        }
      }
    }

    await browser.close();

    // simpan hasil ke file
    fs.writeFileSync('output.json', JSON.stringify(finalData, null, 2));
    console.log(`Data berhasil disimpan ke output.json`);

    // kirim JSON sebagai response API
    res.json(finalData);

  } catch (err) {
    console.error("Terjadi error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
