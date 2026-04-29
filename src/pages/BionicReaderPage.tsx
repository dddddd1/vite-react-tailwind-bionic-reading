import React, { FC, useState, useRef, useEffect, useCallback } from 'react';

import { useTextProcessing, HighlightMode, TextConfig } from '../hooks/useTextProcessing';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const FILE_PDF_NAME = 'download.pdf';

const DEFAULT_CONFIG: TextConfig = {
  fontSize: 16,
  highlightMode: 'half',
  customHighlightRatio: 0.5,
  wordConfigs: {},
};

const STORAGE_KEY = 'bionic-reader-config';

interface ToolbarPosition {
  top: number;
  left: number;
}

interface SelectedWord {
  wordKey: string;
  word: string;
}

export const BionicReaderPage: FC = () => {
  const [isUnicode, setIsUnicode] = useState(false);
  const [textConfig, setTextConfig] = useState<TextConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as TextConfig;
      }
    } catch (e) {
      console.log('No saved config found');
    }
    return DEFAULT_CONFIG;
  });

  const { listPrepText, isDisabled, onClickButton, onChangeTextarea, pretext, processData } =
    useTextProcessing(isUnicode, textConfig, setTextConfig);
  const inputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedWords, setSelectedWords] = useState<SelectedWord[]>([]);
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition | null>(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedWeight, setSelectedWeight] = useState(600);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(textConfig));
  }, [textConfig]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--font-size-read-area',
      `${textConfig.fontSize / 16}rem`
    );
  }, [textConfig.fontSize]);

  const printDocument = () => {
    if (!inputRef.current) return;
    html2canvas(inputRef.current)
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();
        const width = pdf.internal.pageSize.getWidth();
        pdf.addImage(imgData, 'JPEG', 5, 10, width - 10, 0);
        pdf.save(FILE_PDF_NAME);
      })
      .catch((e) => console.error(e));
  };

  const onConvertToUnicodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUnicode(e.target.checked);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value);
    setTextConfig((prev) => ({ ...prev, fontSize: newSize }));
  };

  const handleHighlightModeChange = (mode: HighlightMode) => {
    setTextConfig((prev) => ({ ...prev, highlightMode: mode }));
  };

  const handleCustomRatioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ratio = parseFloat(e.target.value);
    setTextConfig((prev) => ({ ...prev, customHighlightRatio: ratio }));
  };

  const getSelectedWords = useCallback((): SelectedWord[] => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return [];
    }

    const range = selection.getRangeAt(0);
    const selectedWords: SelectedWord[] = [];

    const walker = document.createTreeWalker(
      containerRef.current || document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node: Node) => {
          const element = node as HTMLElement;
          if (element.classList.contains('highlighted-word')) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        },
      }
    );

    let currentNode: Node | null;
    while ((currentNode = walker.nextNode())) {
      const element = currentNode as HTMLElement;
      const wordIndex = element.getAttribute('data-word-index');
      const word = element.getAttribute('data-word');

      if (wordIndex && word) {
        const elementRange = document.createRange();
        elementRange.selectNodeContents(element);

        if (range.intersectsNode(element)) {
          selectedWords.push({
            wordKey: `word-${wordIndex}-${word}`,
            word: word,
          });
        }
      }
    }

    return selectedWords;
  }, []);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    setTimeout(() => {
      const words = getSelectedWords();
      if (words.length > 0) {
        setSelectedWords(words);
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setToolbarPosition({
            top: rect.top + window.scrollY - 50,
            left: rect.left + window.scrollX + rect.width / 2 - 150,
          });
        }
      } else {
        setSelectedWords([]);
        setToolbarPosition(null);
      }
    }, 0);
  }, [getSelectedWords]);

  const handleDocumentClick = useCallback(
    (e: MouseEvent) => {
      if (toolbarPosition) {
        const target = e.target as HTMLElement;
        if (!target.closest('.selection-toolbar')) {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed) {
            setToolbarPosition(null);
            setSelectedWords([]);
          }
        }
      }
    },
    [toolbarPosition]
  );

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [handleMouseUp, handleDocumentClick]);

  const applyHighlightColor = () => {
    selectedWords.forEach((sw) => {
      setTextConfig((prev) => ({
        ...prev,
        wordConfigs: {
          ...prev.wordConfigs,
          [sw.wordKey]: {
            ...prev.wordConfigs[sw.wordKey],
            highlightColor: selectedColor,
          },
        },
      }));
    });
  };

  const applyFontWeight = () => {
    selectedWords.forEach((sw) => {
      setTextConfig((prev) => ({
        ...prev,
        wordConfigs: {
          ...prev.wordConfigs,
          [sw.wordKey]: {
            ...prev.wordConfigs[sw.wordKey],
            fontWeight: selectedWeight,
          },
        },
      }));
    });
  };

  const clearWordStyles = () => {
    selectedWords.forEach((sw) => {
      setTextConfig((prev) => {
        const newWordConfigs = { ...prev.wordConfigs };
        delete newWordConfigs[sw.wordKey];
        return {
          ...prev,
          wordConfigs: newWordConfigs,
        };
      });
    });
    setToolbarPosition(null);
    setSelectedWords([]);
    window.getSelection()?.removeAllRanges();
  };

  const highlightModeOptions: { value: HighlightMode; label: string }[] = [
    { value: 'first-letter', label: '首字母' },
    { value: 'first-two', label: '前两个字母' },
    { value: 'half', label: '一半' },
    { value: 'three-fifths', label: '五分之三' },
    { value: 'custom', label: '自定义比例' },
  ];

  const colorOptions = ['#000000', '#2563EB', '#16A34A', '#DC2626', '#9333EA', '#DB2777'];
  const weightOptions = [400, 500, 600, 700, 800];

  return (
    <div className="px-3 py-20 w-screen h-screen bg-gray-500" ref={containerRef}>
      {toolbarPosition && selectedWords.length > 0 && (
        <div
          className="selection-toolbar"
          style={{
            top: toolbarPosition.top,
            left: toolbarPosition.left,
          }}
        >
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">颜色:</span>
            {colorOptions.map((color) => (
              <button
                key={color}
                onClick={() => {
                  setSelectedColor(color);
                }}
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: color,
                  borderRadius: '50%',
                  border: selectedColor === color ? '2px solid #333' : '1px solid #ccc',
                }}
                title={color}
              />
            ))}
            <button
              onClick={applyHighlightColor}
              className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
            >
              应用颜色
            </button>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">粗细:</span>
            <select
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(parseInt(e.target.value))}
              className="text-xs border rounded px-1"
            >
              {weightOptions.map((w) => (
                <option key={w} value={w}>
                  {w === 400 ? '正常' : w === 500 ? '中等' : w === 600 ? '半粗' : w === 700 ? '粗体' : '特粗'}
                </option>
              ))}
            </select>
            <button
              onClick={applyFontWeight}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs"
            >
              应用粗细
            </button>
          </div>
          <button
            onClick={clearWordStyles}
            className="px-2 py-1 bg-red-500 text-white rounded text-xs"
          >
            清除
          </button>
        </div>
      )}

      <div className="mx-auto max-w-xs h-auto min-h-fit sm:max-w-lg md:max-w-4xl rounded-lg shadow bg-white p-4">
        <h2 className="text-2xl font-bold my-2 text-left">Bionic Reading</h2>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                字体大小: <span className="text-blue-600">{textConfig.fontSize}px</span>
              </label>
              <input
                type="range"
                min="12"
                max="32"
                value={textConfig.fontSize}
                onChange={handleFontSizeChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>12px</span>
                <span>32px</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                高亮模式
              </label>
              <div className="flex flex-wrap gap-2">
                {highlightModeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleHighlightModeChange(option.value)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      textConfig.highlightMode === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {textConfig.highlightMode === 'custom' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自定义高亮比例:{' '}
                <span className="text-blue-600">
                  {Math.round(textConfig.customHighlightRatio * 100)}%
                </span>
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={textConfig.customHighlightRatio}
                onChange={handleCustomRatioChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10%</span>
                <span>90%</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="text-left py-4">
            <h3 className="text-lg font-bold pb-4">Insert Text:</h3>
            <textarea
              className="form-control
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
              focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
              name="text"
              id="controlTextarea"
              cols={30}
              rows={10}
              aria-label="empty textarea"
              placeholder="Empty"
              onChange={onChangeTextarea}
            ></textarea>
            <button
              className="hover:bg-blue-700 bg-blue-600 text-gray-100 py-2 px-4 rounded"
              disabled={isDisabled}
              onClick={onClickButton}
            >
              Convert
            </button>
            <div className="ml-4 inline-block">
              <input type="checkbox" onChange={onConvertToUnicodeChange} />
              <span className="font-normal"> Convert with Unicode</span>
            </div>
          </section>
          <section className="text-left py-4 overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold pb-4 ">Read Section:</h3>

            <p
              className="read-area whitespace-pre-wrap break-all basis-11/12 shadow mb-4 px-3
              py-1.5 select-text cursor-text"
              id="divToPrint"
              ref={inputRef}
            >
              {pretext}
              <span className="t-text">
                {listPrepText.map((text) => (
                  <>{text} </>
                ))}
              </span>
            </p>

            <div className="flex gap-2">
              <button
                className="hover:bg-green-700 bg-green-600 text-gray-100 py-2 px-4 rounded self-start "
                disabled={isDisabled}
                onClick={printDocument}
              >
                Download
              </button>
              {Object.keys(textConfig.wordConfigs).length > 0 && (
                <button
                  className="hover:bg-red-700 bg-red-600 text-gray-100 py-2 px-4 rounded self-start"
                  onClick={() => {
                    setTextConfig((prev) => ({ ...prev, wordConfigs: {} }));
                  }}
                >
                  清除所有自定义样式
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
