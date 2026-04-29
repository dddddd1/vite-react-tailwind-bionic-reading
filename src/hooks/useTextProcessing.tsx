/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState } from 'react';
import { timeout, toUnicodeVariant } from '../util';

export type HighlightMode = 'first-letter' | 'first-two' | 'half' | 'three-fifths' | 'custom';

export interface WordConfig {
  highlightColor?: string;
  fontWeight?: number;
}

export interface TextConfig {
  fontSize: number;
  highlightMode: HighlightMode;
  customHighlightRatio: number;
  wordConfigs: Record<string, WordConfig>;
}

export const useTextProcessing = (
  isUnicode: boolean,
  textConfig: TextConfig,
  setTextConfig: React.Dispatch<React.SetStateAction<TextConfig>>
) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [text, setText] = useState('');
  const [pretext, setPretext] = useState('');
  const [listPrepText, setListPrepText] = useState([] as JSX.Element[]);

  const getHighlightLength = (word: string): number => {
    const { highlightMode, customHighlightRatio } = textConfig;
    const len = word.length;
    if (len === 0) return 0;

    switch (highlightMode) {
      case 'first-letter':
        return 1;
      case 'first-two':
        return Math.min(2, len);
      case 'half':
        return Math.floor(len / 2);
      case 'three-fifths':
        return Math.floor(len * 3 / 5);
      case 'custom':
        return Math.floor(len * customHighlightRatio);
      default:
        return Math.floor(len / 2);
    }
  };

  const onChangeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e?.target.value);
  };

  const processData = () => {
    const prepText = text.split(' ');
    console.log(prepText);

    const listText = prepText.map((elem, index) => {
      let preElem = elem;
      let showNewLine = false;
      const match = /\r|\n/.exec(elem);
      if (match) {
        preElem = elem.trim();
        showNewLine = true;
      }

      const mid = getHighlightLength(preElem);
      const wordKey = `word-${index}-${preElem}`;
      const wordConfig = textConfig.wordConfigs[wordKey] || {};

      return (
        <span key={index} className="highlighted-word" data-word-index={index} data-word={preElem}>
          {showNewLine && (
            <>
              <br />
              <br />
            </>
          )}
          {isUnicode ? (
            <span key={index}>{toUnicodeVariant(preElem.slice(0, mid), 'bold')}</span>
          ) : (
            <span
              key={index}
              className="bio-letter"
              style={{
                color: wordConfig.highlightColor || undefined,
                fontWeight: wordConfig.fontWeight || undefined,
              }}
            >
              {preElem.slice(0, mid)}
            </span>
          )}
          {preElem.slice(mid)}
        </span>
      );
    });

    return listText;
  };

  const onClickButton = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    setPretext('processing...');
    setListPrepText([]);

    console.log('wait...', { e });
    setIsDisabled(true);

    const listPrepText = processData();
    setPretext('processing...');

    await timeout(2000);

    setIsDisabled(false);
    setListPrepText(listPrepText);
    setPretext('');
    console.log('done...');
  };

  const updateWordConfig = (wordKey: string, config: Partial<WordConfig>) => {
    setTextConfig((prev) => ({
      ...prev,
      wordConfigs: {
        ...prev.wordConfigs,
        [wordKey]: {
          ...prev.wordConfigs[wordKey],
          ...config,
        },
      },
    }));
  };

  return {
    listPrepText,
    pretext,
    isDisabled,
    onClickButton,
    processData,
    onChangeTextarea,
    updateWordConfig,
  };
};
