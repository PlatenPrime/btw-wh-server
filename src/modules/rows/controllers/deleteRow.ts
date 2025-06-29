import { Request, Response } from 'express';
import { Row } from '../../rows/models/Row.js';
import { Pallet } from '../../pallets/models/Pallet.js';
import { Pos } from '../../poses/models/Pos.js';

export const deleteRow = async (req: Request, res: Response) => {
  const row = await Row.findById(req.params.id);
  if (!row) return res.status(404).json({ message: 'Row not found' });

  // Находим все паллеты, принадлежащие этому ряду
  const pallets = await Pallet.find({ row: row._id });

  // Получаем все их ID
  const palletIds = pallets.map(p => p._id);

  // Удаляем все позиции, связанные с этими паллетами
  await Pos.deleteMany({ pallet: { $in: palletIds } });

  // Удаляем паллеты
  await Pallet.deleteMany({ row: row._id });

  // Удаляем сам ряд
  await row.deleteOne();

  res.json({ message: 'Row and related pallets and positions deleted' });
};