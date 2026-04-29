// 收藏项接口
export interface FavoriteItem {
  id: string;
  title: string;
  content: string;
  folderId: string;
  createdAt: number;
  updatedAt: number;
}

// 收藏文件夹接口
export interface FavoriteFolder {
  id: string;
  name: string;
  createdAt: number;
}

// 本地存储键
const STORAGE_KEYS = {
  FOLDERS: 'bionic-reading-folders',
  FAVORITES: 'bionic-reading-favorites',
};

// 生成唯一ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// 获取所有文件夹
export const getFolders = (): FavoriteFolder[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取文件夹失败:', error);
    return [];
  }
};

// 保存文件夹列表
const saveFolders = (folders: FavoriteFolder[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
  } catch (error) {
    console.error('保存文件夹失败:', error);
  }
};

// 创建新文件夹
export const createFolder = (name: string): FavoriteFolder => {
  const folders = getFolders();
  const newFolder: FavoriteFolder = {
    id: generateId(),
    name,
    createdAt: Date.now(),
  };
  saveFolders([...folders, newFolder]);
  return newFolder;
};

// 更新文件夹
export const updateFolder = (id: string, name: string): FavoriteFolder | null => {
  const folders = getFolders();
  const index = folders.findIndex(folder => folder.id === id);
  if (index === -1) return null;
  
  const updatedFolder = { ...folders[index], name };
  folders[index] = updatedFolder;
  saveFolders(folders);
  return updatedFolder;
};

// 删除文件夹（同时删除该文件夹下的所有收藏项）
export const deleteFolder = (id: string): boolean => {
  const folders = getFolders();
  const filteredFolders = folders.filter(folder => folder.id !== id);
  if (filteredFolders.length === folders.length) return false;
  
  // 删除该文件夹下的所有收藏项
  const favorites = getFavorites();
  const filteredFavorites = favorites.filter(favorite => favorite.folderId !== id);
  saveFavorites(filteredFavorites);
  
  saveFolders(filteredFolders);
  return true;
};

// 获取所有收藏项
export const getFavorites = (): FavoriteItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取收藏项失败:', error);
    return [];
  }
};

// 保存收藏项列表
const saveFavorites = (favorites: FavoriteItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  } catch (error) {
    console.error('保存收藏项失败:', error);
  }
};

// 创建新收藏项
export const createFavorite = (title: string, content: string, folderId: string): FavoriteItem => {
  const favorites = getFavorites();
  const newFavorite: FavoriteItem = {
    id: generateId(),
    title,
    content,
    folderId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  saveFavorites([...favorites, newFavorite]);
  return newFavorite;
};

// 更新收藏项
export const updateFavorite = (id: string, title?: string, content?: string, folderId?: string): FavoriteItem | null => {
  const favorites = getFavorites();
  const index = favorites.findIndex(favorite => favorite.id === id);
  if (index === -1) return null;
  
  const updatedFavorite = {
    ...favorites[index],
    ...(title !== undefined && { title }),
    ...(content !== undefined && { content }),
    ...(folderId !== undefined && { folderId }),
    updatedAt: Date.now(),
  };
  
  favorites[index] = updatedFavorite;
  saveFavorites(favorites);
  return updatedFavorite;
};

// 删除收藏项
export const deleteFavorite = (id: string): boolean => {
  const favorites = getFavorites();
  const filteredFavorites = favorites.filter(favorite => favorite.id !== id);
  if (filteredFavorites.length === favorites.length) return false;
  
  saveFavorites(filteredFavorites);
  return true;
};

// 根据文件夹获取收藏项
export const getFavoritesByFolder = (folderId: string): FavoriteItem[] => {
  const favorites = getFavorites();
  return favorites.filter(favorite => favorite.folderId === folderId);
};
