import { Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const parseProducts = async (req: Request, res: Response) => {
  try {
    const targetUrl = 'https://sharik.ua/ua/search/?q=1102-0266'; // Укажи актуальную ссылку

    const { data: html } = await axios.get(targetUrl);
    const $ = cheerio.load(html);

    const products: any[] = [];

    $('.car-col .one-item').each((_, el) => {
      const title = $(el).find('.one-item-tit').text().trim();
      const price = $(el).find('.one-item-price').text().trim();
      const quantity = $(el).find('.one-item-quantity').text().trim();
      const image = $(el).find('.one-watch-thumb-in img').attr('src');
      const link = $(el).find('.one-watch-thumb a').attr('href');

      products.push({
        title,
        price,
        quantity,
        image: image ? `https://sharik.ua/${image}` : null,
        link: link ? `https://sharik.ua/${link}` : null,
      });
    });

    res.json({ products });
  } catch (error) {
    console.error('Parsing error:', error);
    res.status(500).json({ message: 'Parsing failed', error });
  }
};
