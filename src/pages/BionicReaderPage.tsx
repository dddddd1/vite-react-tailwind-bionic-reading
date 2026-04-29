import React, { FC, useState, useRef, useEffect } from 'react';

import { useTextProcessing } from '../hooks/useTextProcessing';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  getFolders, 
  getFavorites, 
  createFolder, 
  updateFolder, 
  deleteFolder, 
  createFavorite, 
  updateFavorite, 
  deleteFavorite, 
  getFavoritesByFolder,
  FavoriteFolder,
  FavoriteItem
} from '../util/storage';
import { cleanText } from '../util/textCleaner';

const FILE_PDF_NAME = 'download.pdf';
const FILE_IMAGE_NAME = 'bionic-reading.png';

// 导出分辨率选项
const RESOLUTION_OPTIONS = [
  { label: '低 (1x)', value: 1 },
  { label: '中 (2x)', value: 2 },
  { label: '高 (3x)', value: 3 },
  { label: '超高清 (4x)', value: 4 },
];

export const BionicReaderPage: FC = () => {
  const [isUnicode, setIsUnicode] = useState(false);
  const { listPrepText, isDisabled, onClickButton, onChangeTextarea, pretext, setText, text } =
    useTextProcessing(isUnicode);
  const inputRef = useRef(null);
  
  // 收藏相关状态
  const [folders, setFolders] = useState<FavoriteFolder[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [showAddFavoriteModal, setShowAddFavoriteModal] = useState(false);
  const [showEditFolderModal, setShowEditFolderModal] = useState(false);
  const [showEditFavoriteModal, setShowEditFavoriteModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFavoriteTitle, setNewFavoriteTitle] = useState('');
  const [newFavoriteFolderId, setNewFavoriteFolderId] = useState('');
  const [editingFolder, setEditingFolder] = useState<FavoriteFolder | null>(null);
  const [editingFavorite, setEditingFavorite] = useState<FavoriteItem | null>(null);
  
  // 导出图片相关状态
  const [showExportSettings, setShowExportSettings] = useState(false);
  const [exportResolution, setExportResolution] = useState(2);
  const [exportTransparent, setExportTransparent] = useState(false);
  
  // 文本净化相关状态
  const [originalText, setOriginalText] = useState('');
  const [isTextCleaned, setIsTextCleaned] = useState(false);

  // 初始化加载文件夹和收藏
  useEffect(() => {
    loadFoldersAndFavorites();
  }, []);

  // 加载文件夹和收藏
  const loadFoldersAndFavorites = () => {
    const loadedFolders = getFolders();
    const loadedFavorites = getFavorites();
    setFolders(loadedFolders);
    setFavorites(loadedFavorites);
  };

  // 打印文档（导出PDF）
  const printDocument = () => {
    html2canvas(inputRef.current as unknown as HTMLElement)
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const width = pdf.internal.pageSize.getWidth();
        pdf.addImage(imgData, 'JPEG', 5, 10, width - 10, 0);
        pdf.save(FILE_PDF_NAME);
      })
      .catch((e) => console.error(e));
  };

  // 导出图片 - 使用与 PDF 导出完全相同的基础逻辑
  const exportAsImage = () => {
    console.log('导出图片按钮被点击');
    
    // 直接使用与 PDF 导出完全相同的方式调用 html2canvas
    html2canvas(inputRef.current as unknown as HTMLElement)
      .then((canvas) => {
        console.log('html2canvas 成功，canvas 尺寸:', canvas.width, 'x', canvas.height);
        
        // 检查 canvas 是否有效
        if (canvas.width === 0 || canvas.height === 0) {
          alert('导出失败：请确保先点击 "Convert" 按钮生成仿生阅读效果');
          return;
        }
        
        // 1. 基础导出：先尝试最简单的方式
        console.log('尝试基础导出...');
        try {
          const link = document.createElement('a');
          link.download = FILE_IMAGE_NAME;
          link.href = canvas.toDataURL('image/png');
          
          // 确保链接可点击
          link.style.display = 'none';
          document.body.appendChild(link);
          
          // 触发点击
          console.log('触发下载...');
          link.click();
          
          // 清理
          setTimeout(() => {
            document.body.removeChild(link);
            console.log('下载链接已清理');
          }, 100);
          
          setShowExportSettings(false);
          console.log('基础导出尝试完成');
        } catch (error) {
          console.error('基础导出失败:', error);
          
          // 2. 备用方案：使用不同的方法
          console.log('尝试备用导出方案...');
          try {
            // 尝试使用 toBlob 方法
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = FILE_IMAGE_NAME;
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('备用方案导出成功');
              } else {
                alert('导出失败：无法生成图片数据');
              }
            }, 'image/png');
          } catch (blobError) {
            console.error('备用方案也失败:', blobError);
            alert('导出图片失败，请尝试刷新页面后重试');
          }
        }
      })
      .catch((error) => {
        console.error('html2canvas 处理失败:', error);
        alert('导出图片失败：' + error.message);
      });
  };

  // 净化文本
  const handleCleanText = () => {
    if (!text.trim()) return;
    
    // 保存原始文本
    setOriginalText(text);
    // 净化文本
    const cleanedText = cleanText(text);
    setText(cleanedText);
    setIsTextCleaned(true);
  };

  // 还原原始文本
  const handleRestoreText = () => {
    if (originalText) {
      setText(originalText);
      setIsTextCleaned(false);
    }
  };

  // 切换收藏面板
  const toggleFavorites = () => {
    if (!showFavorites) {
      loadFoldersAndFavorites();
    }
    setShowFavorites(!showFavorites);
  };

  // 添加文件夹
  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    
    createFolder(newFolderName.trim());
    setNewFolderName('');
    setShowAddFolderModal(false);
    loadFoldersAndFavorites();
  };

  // 编辑文件夹
  const handleEditFolder = () => {
    if (!editingFolder || !newFolderName.trim()) return;
    
    updateFolder(editingFolder.id, newFolderName.trim());
    setNewFolderName('');
    setEditingFolder(null);
    setShowEditFolderModal(false);
    loadFoldersAndFavorites();
  };

  // 删除文件夹
  const handleDeleteFolder = (folderId: string) => {
    if (confirm('确定要删除此文件夹吗？该文件夹下的所有收藏项也将被删除。')) {
      deleteFolder(folderId);
      if (selectedFolderId === folderId) {
        setSelectedFolderId('');
      }
      loadFoldersAndFavorites();
    }
  };

  // 添加收藏
  const handleAddFavorite = () => {
    if (!newFavoriteTitle.trim() || !text.trim()) return;
    
    createFavorite(newFavoriteTitle.trim(), text, newFavoriteFolderId || 'uncategorized');
    setNewFavoriteTitle('');
    setNewFavoriteFolderId('');
    setShowAddFavoriteModal(false);
    loadFoldersAndFavorites();
  };

  // 编辑收藏
  const handleEditFavorite = () => {
    if (!editingFavorite || !newFavoriteTitle.trim()) return;
    
    updateFavorite(editingFavorite.id, newFavoriteTitle.trim(), undefined, newFavoriteFolderId || undefined);
    setNewFavoriteTitle('');
    setNewFavoriteFolderId('');
    setEditingFavorite(null);
    setShowEditFavoriteModal(false);
    loadFoldersAndFavorites();
  };

  // 删除收藏
  const handleDeleteFavorite = (favoriteId: string) => {
    if (confirm('确定要删除此收藏项吗？')) {
      deleteFavorite(favoriteId);
      loadFoldersAndFavorites();
    }
  };

  // 加载收藏内容
  const loadFavoriteContent = (favorite: FavoriteItem) => {
    setText(favorite.content);
    setShowFavorites(false);
  };

  // 打开编辑文件夹模态框
  const openEditFolderModal = (folder: FavoriteFolder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setShowEditFolderModal(true);
  };

  // 打开编辑收藏模态框
  const openEditFavoriteModal = (favorite: FavoriteItem) => {
    setEditingFavorite(favorite);
    setNewFavoriteTitle(favorite.title);
    setNewFavoriteFolderId(favorite.folderId);
    setShowEditFavoriteModal(true);
  };

  // 获取当前选择的文件夹下的收藏项
  const getCurrentFavorites = () => {
    if (selectedFolderId) {
      return getFavoritesByFolder(selectedFolderId);
    }
    return favorites;
  };

  const onConvertToUnicodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUnicode(e.target.checked);
  };

  return (
    <div className='px-3 py-20 w-screen h-screen bg-gray-500'>
      <div className='mx-auto max-w-xs h-auto min-h-fit sm:max-w-lg md:max-w-6xl rounded-lg shadow bg-white p-4'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-2xl font-bold text-left'>Bionic Reading</h2>
          <button
            className='hover:bg-purple-700 bg-purple-600 text-gray-100 py-2 px-4 rounded'
            onClick={toggleFavorites}
          >
            {showFavorites ? '隐藏收藏' : '我的收藏'}
          </button>
        </div>
        
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {/* 左侧：文本输入区 */}
          <section className='text-left py-4'>
            <h3 className='text-lg font-bold pb-4'>Insert Text:</h3>
            <textarea
              className='form-control
              block
              w-full
              px-3
              py-1.5
              text-base
              font-normal
              text-gray-700
              bg-white bg-clip-padding
              border border-solid border-gray-300
              rounded-lg shadow
              transition
              ease-in-out
              m-0
              mb-4
              focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none'
              name='text'
              id='controlTextarea'
              cols={30}
              rows={10}
              aria-label='empty textarea'
              placeholder='Empty'
              value={text}
              onChange={onChangeTextarea}
            ></textarea>
            
            <div className='flex flex-wrap gap-2 mb-4'>
              <button
                className='hover:bg-blue-700 bg-blue-600 text-gray-100 py-2 px-4 rounded'
                disabled={isDisabled}
                onClick={onClickButton}
              >
                Convert
              </button>
              
              <button
                className='hover:bg-orange-700 bg-orange-600 text-gray-100 py-2 px-4 rounded'
                disabled={isDisabled || !text.trim()}
                onClick={handleCleanText}
              >
                净化文本
              </button>
              
              {isTextCleaned && (
                <button
                  className='hover:bg-gray-700 bg-gray-600 text-gray-100 py-2 px-4 rounded'
                  onClick={handleRestoreText}
                >
                  还原文本
                </button>
              )}
              
              <button
                className='hover:bg-pink-700 bg-pink-600 text-gray-100 py-2 px-4 rounded'
                disabled={isDisabled || !text.trim()}
                onClick={() => {
                  setNewFavoriteTitle('');
                  setNewFavoriteFolderId('');
                  setShowAddFavoriteModal(true);
                }}
              >
                收藏
              </button>
            </div>
            
            <div className='flex items-center gap-4'>
              <div className='flex items-center'>
                <input 
                  type='checkbox' 
                  id='unicodeCheckbox'
                  onChange={onConvertToUnicodeChange} 
                  checked={isUnicode}
                />
                <label htmlFor='unicodeCheckbox' className='ml-2 font-normal'> Convert with Unicode</label>
              </div>
            </div>
          </section>
          
          {/* 中间：阅读区 */}
          <section className='text-left py-4 overflow-hidden flex flex-col'>
            <h3 className='text-lg font-bold pb-4 '>Read Section:</h3>

            <p
              className='whitespace-pre-wrap break-all basis-11/12 shadow mb-4 px-3
              py-1.5'
              id='divToPrint'
              ref={inputRef}
              style={{ backgroundColor: exportTransparent ? 'transparent' : 'white' }}
            >
              {pretext}
              <span className='t-text'>
                {listPrepText.map((text, index) => (
                  <span key={index}>{text} </span>
                ))}
              </span>
            </p>

            <div className='flex flex-wrap gap-2'>
              <button
                className='hover:bg-green-700 bg-green-600 text-gray-100 py-2 px-4 rounded self-start '
                disabled={isDisabled}
                onClick={printDocument}
              >
                下载PDF
              </button>
              
              <div className='relative'>
                <button
                  className='hover:bg-teal-700 bg-teal-600 text-gray-100 py-2 px-4 rounded self-start'
                  disabled={isDisabled}
                  onClick={() => setShowExportSettings(!showExportSettings)}
                >
                  导出图片
                </button>
                
                {showExportSettings && (
                  <div className='absolute top-full left-0 mt-2 p-4 bg-white rounded-lg shadow-lg z-10 min-w-64'>
                    <div className='mb-3'>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        导出分辨率
                      </label>
                      <select
                        className='form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none'
                        value={exportResolution}
                        onChange={(e) => setExportResolution(Number(e.target.value))}
                      >
                        {RESOLUTION_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className='mb-3'>
                      <label className='flex items-center'>
                        <input
                          type='checkbox'
                          checked={exportTransparent}
                          onChange={(e) => setExportTransparent(e.target.checked)}
                          className='mr-2'
                        />
                        <span className='text-sm font-medium text-gray-700'>背景透明</span>
                      </label>
                    </div>
                    
                    <div className='flex gap-2'>
                      <button
                        className='hover:bg-teal-700 bg-teal-600 text-gray-100 py-1 px-3 rounded'
                        onClick={exportAsImage}
                      >
                        确认导出
                      </button>
                      <button
                        className='hover:bg-gray-500 bg-gray-400 text-gray-100 py-1 px-3 rounded'
                        onClick={() => setShowExportSettings(false)}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          
          {/* 右侧：收藏面板 */}
          {showFavorites && (
            <section className='text-left py-4 border-l border-gray-200 pl-4'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-bold'>我的收藏</h3>
                <button
                  className='hover:bg-blue-700 bg-blue-600 text-gray-100 py-1 px-3 rounded text-sm'
                  onClick={() => {
                    setNewFolderName('');
                    setShowAddFolderModal(true);
                  }}
                >
                  + 新建文件夹
                </button>
              </div>
              
              {/* 文件夹列表 */}
              <div className='mb-4'>
                <h4 className='text-sm font-medium text-gray-600 mb-2'>文件夹</h4>
                <div className='space-y-1'>
                  <button
                    className={`w-full text-left px-3 py-2 rounded ${selectedFolderId === '' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                    onClick={() => setSelectedFolderId('')}
                  >
                    全部收藏
                  </button>
                  {folders.map(folder => (
                    <div key={folder.id} className='flex items-center'>
                      <button
                        className={`flex-1 text-left px-3 py-2 rounded ${selectedFolderId === folder.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                        onClick={() => setSelectedFolderId(folder.id)}
                      >
                        📁 {folder.name}
                      </button>
                      <div className='flex gap-1'>
                        <button
                          className='text-gray-500 hover:text-blue-600 p-1'
                          onClick={() => openEditFolderModal(folder)}
                          title='编辑'
                        >
                          ✏️
                        </button>
                        <button
                          className='text-gray-500 hover:text-red-600 p-1'
                          onClick={() => handleDeleteFolder(folder.id)}
                          title='删除'
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 收藏项列表 */}
              <div>
                <h4 className='text-sm font-medium text-gray-600 mb-2'>
                  收藏项 ({getCurrentFavorites().length})
                </h4>
                {getCurrentFavorites().length === 0 ? (
                  <p className='text-gray-500 text-sm'>暂无收藏项</p>
                ) : (
                  <div className='space-y-2 max-h-96 overflow-y-auto'>
                    {getCurrentFavorites().map(favorite => (
                      <div key={favorite.id} className='border border-gray-200 rounded p-3 hover:shadow-md transition-shadow'>
                        <div className='flex justify-between items-start mb-1'>
                          <h5 className='font-medium text-sm truncate flex-1 mr-2'>
                            {favorite.title}
                          </h5>
                          <div className='flex gap-1'>
                            <button
                              className='text-gray-500 hover:text-blue-600 text-sm'
                              onClick={() => openEditFavoriteModal(favorite)}
                              title='编辑'
                            >
                              ✏️
                            </button>
                            <button
                              className='text-gray-500 hover:text-red-600 text-sm'
                              onClick={() => handleDeleteFavorite(favorite.id)}
                              title='删除'
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <p className='text-xs text-gray-500 mb-2'>
                          {new Date(favorite.createdAt).toLocaleString()}
                        </p>
                        <p className='text-sm text-gray-700 line-clamp-3 mb-2'>
                          {favorite.content.substring(0, 100)}
                          {favorite.content.length > 100 && '...'}
                        </p>
                        <button
                          className='text-sm text-blue-600 hover:text-blue-800 font-medium'
                          onClick={() => loadFavoriteContent(favorite)}
                        >
                          加载内容
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
      
      {/* 添加文件夹模态框 */}
      {showAddFolderModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 max-w-full mx-4'>
            <h3 className='text-lg font-bold mb-4'>新建文件夹</h3>
            <input
              type='text'
              className='form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 mb-4 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none'
              placeholder='文件夹名称'
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <div className='flex justify-end gap-2'>
              <button
                className='hover:bg-gray-500 bg-gray-400 text-gray-100 py-2 px-4 rounded'
                onClick={() => {
                  setNewFolderName('');
                  setShowAddFolderModal(false);
                }}
              >
                取消
              </button>
              <button
                className='hover:bg-blue-700 bg-blue-600 text-gray-100 py-2 px-4 rounded'
                onClick={handleAddFolder}
                disabled={!newFolderName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 编辑文件夹模态框 */}
      {showEditFolderModal && editingFolder && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 max-w-full mx-4'>
            <h3 className='text-lg font-bold mb-4'>编辑文件夹</h3>
            <input
              type='text'
              className='form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 mb-4 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none'
              placeholder='文件夹名称'
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <div className='flex justify-end gap-2'>
              <button
                className='hover:bg-gray-500 bg-gray-400 text-gray-100 py-2 px-4 rounded'
                onClick={() => {
                  setNewFolderName('');
                  setEditingFolder(null);
                  setShowEditFolderModal(false);
                }}
              >
                取消
              </button>
              <button
                className='hover:bg-blue-700 bg-blue-600 text-gray-100 py-2 px-4 rounded'
                onClick={handleEditFolder}
                disabled={!newFolderName.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 添加收藏模态框 */}
      {showAddFavoriteModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 max-w-full mx-4'>
            <h3 className='text-lg font-bold mb-4'>添加收藏</h3>
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                标题
              </label>
              <input
                type='text'
                className='form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none'
                placeholder='收藏标题'
                value={newFavoriteTitle}
                onChange={(e) => setNewFavoriteTitle(e.target.value)}
              />
            </div>
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                选择文件夹
              </label>
              <select
                className='form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none'
                value={newFavoriteFolderId}
                onChange={(e) => setNewFavoriteFolderId(e.target.value)}
              >
                <option value=''>未分类</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex justify-end gap-2'>
              <button
                className='hover:bg-gray-500 bg-gray-400 text-gray-100 py-2 px-4 rounded'
                onClick={() => {
                  setNewFavoriteTitle('');
                  setNewFavoriteFolderId('');
                  setShowAddFavoriteModal(false);
                }}
              >
                取消
              </button>
              <button
                className='hover:bg-pink-700 bg-pink-600 text-gray-100 py-2 px-4 rounded'
                onClick={handleAddFavorite}
                disabled={!newFavoriteTitle.trim()}
              >
                收藏
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 编辑收藏模态框 */}
      {showEditFavoriteModal && editingFavorite && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 w-96 max-w-full mx-4'>
            <h3 className='text-lg font-bold mb-4'>编辑收藏</h3>
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                标题
              </label>
              <input
                type='text'
                className='form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none'
                placeholder='收藏标题'
                value={newFavoriteTitle}
                onChange={(e) => setNewFavoriteTitle(e.target.value)}
              />
            </div>
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                选择文件夹
              </label>
              <select
                className='form-control block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none'
                value={newFavoriteFolderId}
                onChange={(e) => setNewFavoriteFolderId(e.target.value)}
              >
                <option value=''>未分类</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='flex justify-end gap-2'>
              <button
                className='hover:bg-gray-500 bg-gray-400 text-gray-100 py-2 px-4 rounded'
                onClick={() => {
                  setNewFavoriteTitle('');
                  setNewFavoriteFolderId('');
                  setEditingFavorite(null);
                  setShowEditFavoriteModal(false);
                }}
              >
                取消
              </button>
              <button
                className='hover:bg-blue-700 bg-blue-600 text-gray-100 py-2 px-4 rounded'
                onClick={handleEditFavorite}
                disabled={!newFavoriteTitle.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
