/**
 * Строит условие фильтрации по полю `title` (регистронезависимое совпадение).
 * @param search строка поиска
 * @returns объект для Mongo `$or` по title или `null`, если поиск пустой
 */
export function buildVariantSearchFilter(
  search: string | undefined
): { $or: Array<{ title?: { $regex: string; $options: string } }> } | null {
  const trimmed = search?.trim();
  if (!trimmed) return null;

  // Экранируем спецсимволы, чтобы пользовательский input не ломал regex
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = { $regex: escaped, $options: "i" };

  return {
    $or: [{ title: re }],
  };
}

