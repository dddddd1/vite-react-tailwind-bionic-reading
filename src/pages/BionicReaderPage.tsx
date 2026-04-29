import React, { useState, useEffect, useCallback } from 'react';
import { useTextProcessing } from '../hooks/useTextProcessing';

const BionicReaderPage: React.FC = () => {
  const [isUnicode, setIsUnicode] = useState(false);
  const [ignoreShortWords, setIgnoreShortWords] = useState<number>(0);
  const [originalText, setOriginalText] = useState('');
  const [isDeduplicated, setIsDeduplicated] = useState(false);

  const {
    listPrepText,
    pretext,
    isDisabled,
    onClickButton,
    processData,
    onChangeTextarea,
    text,
  } = useTextProcessing(isUnicode, ignoreShortWords);

  useEffect(() => {
    const savedIgnoreShortWords = localStorage.getItem('ignoreShortWords');
    if (savedIgnoreShortWords !== null) {
      const parsed = parseInt(savedIgnoreShortWords, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        setIgnoreShortWords(parsed);
      }
    }
  }, []);

  const handleIgnoreShortWordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    const newValue = isNaN(value) || value < 0 ? 0 : value;
    setIgnoreShortWords(newValue);
    localStorage.setItem('ignoreShortWords', newValue.toString());
  };

  const resetToDefaults = () => {
    setIgnoreShortWords(0);
    localStorage.removeItem('ignoreShortWords');
  };

  const exportToMarkdown = useCallback(() => {
    if (!text) {
      alert('请先输入文本进行处理');
      return;
    }

    const paragraphs = text.split(/\r?\n/);
    const markdownLines: string[] = [];

    paragraphs.forEach((paragraph: string) => {
      if (paragraph.trim() === '') {
        markdownLines.push('');
      } else {
        const words = paragraph.split(/\s+/);
        const processedWords = words.map((word: string) => {
          const cleanWord = word.replace(/[.,!?;:'"()\[\]{}]+$/, '');
          const punctuation = word.slice(cleanWord.length);

          if (ignoreShortWords > 0 && cleanWord.length <= ignoreShortWords) {
            return word;
          }

          if (cleanWord.length === 0) {
            return word;
          }

          const mid = Math.floor(cleanWord.length * 3 / 5);
          const boldPart = cleanWord.slice(0, mid);
          const normalPart = cleanWord.slice(mid);

          return `**${boldPart}**${normalPart}${punctuation}`;
        });

        markdownLines.push(processedWords.join(' '));
      }
    });

    const markdownContent = markdownLines.join('\n');
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'bionic-reading.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [text, ignoreShortWords]);

  const deduplicateText = useCallback(() => {
    if (!text) {
      alert('请先输入文本');
      return;
    }

    const paragraphs = text.split(/\r?\n/);
    const deduplicatedParagraphs: string[] = [];
    const seenParagraphs = new Set<string>();

    paragraphs.forEach((paragraph: string) => {
      const trimmedParagraph = paragraph.trim();
      if (trimmedParagraph === '') {
        deduplicatedParagraphs.push(paragraph);
      } else if (!seenParagraphs.has(trimmedParagraph)) {
        seenParagraphs.add(trimmedParagraph);
        deduplicatedParagraphs.push(paragraph);
      }
    });

    const deduplicatedParagraphs2: string[] = [];
    deduplicatedParagraphs.forEach((paragraph: string) => {
      const sentences = paragraph.split(/([.!?。！？]+)/);
      const deduplicatedSentences: string[] = [];
      const seenSentences = new Set<string>();

      for (let i = 0; i < sentences.length; i += 2) {
        const sentence = sentences[i] || '';
        const punctuation = sentences[i + 1] || '';
        const trimmedSentence = sentence.trim();

        if (trimmedSentence === '') {
          if (punctuation) {
            deduplicatedSentences.push(punctuation);
          }
        } else if (!seenSentences.has(trimmedSentence)) {
          seenSentences.add(trimmedSentence);
          deduplicatedSentences.push(sentence + punctuation);
        }
      }

      deduplicatedParagraphs2.push(deduplicatedSentences.join(''));
    });

    const deduplicatedText = deduplicatedParagraphs2.join('\n');
    setOriginalText(text);
    setIsDeduplicated(true);

    const textarea = document.querySelector('textarea');
    if (textarea) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(textarea, deduplicatedText);
      }
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
    }
  }, [text]);

  const restoreOriginalText = useCallback(() => {
    if (!originalText) {
      return;
    }

    const textarea = document.querySelector('textarea');
    if (textarea) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(textarea, originalText);
      }
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
    }

    setIsDeduplicated(false);
    setOriginalText('');
  }, [originalText]);

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4'>
      <div className='max-w-6xl mx-auto'>
        <header className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-800 mb-2'>Bionic Reading Tool</h1>
          <p className='text-gray-600'>
            A revolutionary way for guiding the eyes through text using artificial fixation spots
          </p>
        </header>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='bg-white rounded-lg shadow-md p-6'>
            <h2 className='text-xl font-semibold text-gray-700 mb-4'>输入文本</h2>
            <textarea
              className='w-full h-64 p-4 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='在此输入您想要转换为仿生阅读格式的文本...'
              onChange={onChangeTextarea}
              value={text}
            />

            <div className='mt-4 space-y-4'>
              <div className='flex items-center space-x-4'>
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={isUnicode}
                    onChange={(e) => setIsUnicode(e.target.checked)}
                    className='w-4 h-4 text-blue-600 rounded focus:ring-blue-500'
                  />
                  <span className='text-gray-700'>使用 Unicode 加粗</span>
                </label>
              </div>

              <div className='flex items-center space-x-4'>
                <label className='text-gray-700'>忽略短词（字母数）：</label>
                <input
                  type='number'
                  min='0'
                  max='10'
                  value={ignoreShortWords}
                  onChange={handleIgnoreShortWordsChange}
                  className='w-20 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='0'
                />
                <span className='text-sm text-gray-500'>
                  {ignoreShortWords > 0
                    ? `忽略 ${ignoreShortWords} 个字母及以下的单词`
                    : '不忽略任何单词'}
                </span>
                <button
                  onClick={resetToDefaults}
                  className='px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors'
                >
                  重置默认
                </button>
              </div>

              <div className='flex flex-wrap gap-3'>
                <button
                  onClick={onClickButton}
                  disabled={isDisabled}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    isDisabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isDisabled ? '处理中...' : '转换文本'}
                </button>

                <button
                  onClick={exportToMarkdown}
                  disabled={!text}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    !text
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  导出 Markdown
                </button>

                <button
                  onClick={deduplicateText}
                  disabled={!text}
                  className={`px-6 py-2 rounded-md font-medium transition-colors ${
                    !text
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  一键去重
                </button>

                {isDeduplicated && (
                  <button
                    onClick={restoreOriginalText}
                    className='px-6 py-2 rounded-md font-medium bg-red-600 text-white hover:bg-red-700 transition-colors'
                  >
                    恢复原文
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6'>
            <h2 className='text-xl font-semibold text-gray-700 mb-4'>仿生阅读效果</h2>
            <div className='h-64 p-4 border border-gray-200 rounded-md bg-gray-50 overflow-y-auto'>
              {pretext ? (
                <p className='text-gray-500 italic'>{pretext}</p>
              ) : listPrepText.length > 0 ? (
                <div className='text-lg leading-relaxed'>
                  {listPrepText.map((element, index) => (
                    <span key={index}>{element}</span>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 italic'>
                  请在左侧输入文本并点击"转换文本"按钮查看仿生阅读效果
                </p>
              )}
            </div>

            {text && (
              <div className='mt-4 p-3 bg-blue-50 rounded-md'>
                <p className='text-sm text-blue-700'>
                  <span className='font-semibold'>提示：</span>
                  导出的 Markdown 文件将使用 <code className='bg-blue-100 px-1 rounded'>**加粗**</code> 标记表示仿生阅读的固定点。
                </p>
              </div>
            )}

            {isDeduplicated && (
              <div className='mt-4 p-3 bg-orange-50 rounded-md'>
                <p className='text-sm text-orange-700'>
                  <span className='font-semibold'>已去重：</span>
                  文本中的重复句子和段落已被移除。点击"恢复原文"可撤销此操作。
                </p>
              </div>
            )}
          </div>
        </div>

        <footer className='mt-8 text-center text-gray-500 text-sm'>
          <p>
            Bionic Reading Tool - 让阅读更高效 | 
            <a 
              href='https://github.com/crisanlucid/vite-react-tailwind-bionic-reading' 
              target='_blank' 
              rel='noopener noreferrer'
              className='text-blue-600 hover:underline ml-1'
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export { BionicReaderPage };
