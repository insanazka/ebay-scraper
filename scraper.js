import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

puppeteer.use(StealthPlugin());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Fungsi pecah array jadi batch
function chunkArray(arr, size) {
  return arr.reduce((chunks, item, i) => {
    if (i % size === 0) chunks.push([]);
    chunks[chunks.length - 1].push(item);
    return chunks;
  }, []);
}

// Fungsi untuk minta deskripsi dari AI
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

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://www.ebay.com.sg/sch/i.html?_nkw=nike&_sacat=0&_from=R40&_trksid=m570.l1313', {
    waitUntil: 'networkidle2'
  });

  const products = await page.$$eval('.s-item', items =>
    items.map(item => ({
      title: item.querySelector('.s-item__title')?.innerText || '',
      price: item.querySelector('.s-item__price')?.innerText || '',
    }))
  );

  console.log(`Total produk ditemukan: ${products.length}`);

  const batches = chunkArray(products, 20);
  let finalData = [];

  for (let i = 0; i < batches.length; i++) {
    console.log(`Memproses batch ${i + 1} dari ${batches.length}...`);
    try {
      const dataWithDesc = await extractDataWithAI(batches[i]);
      finalData = finalData.concat(dataWithDesc);
    } catch (err) {
      console.error(`Error batch ${i + 1}:`, err.message);
    }
  }

  console.log("Hasil akhir:");
  console.log(finalData);

  try {
    fs.writeFileSync('output.json', JSON.stringify(finalData, null, 2));
    console.log(`✅ Data berhasil disimpan ke output.json`);
  } catch (err) {
    console.error("Gagal membuat JSON:", err);
  }

  await browser.close();
})();
