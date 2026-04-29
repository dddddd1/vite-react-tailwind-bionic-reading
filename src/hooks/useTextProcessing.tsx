/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useState } from 'react';
import { timeout, toUnicodeVariant } from '../util';

export const useTextProcessing = (isUnicode: boolean, ignoreShortWords: number = 0) => {
  const [isDisabled, setIsDisabled] = useState(false);
  const [text, setText] = useState('');
  const [pretext, setPretext] = useState('');
  const [listPrepText, setListPrepText] = useState([] as JSX.Element[]);

  const onChangeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e?.target.value);
  };

  const processData = () => {
    const paragraphs = text.split(/(\r?\n)/);
    const listText: JSX.Element[] = [];
    let elementIndex = 0;

    paragraphs.forEach((paragraphPart) => {
      if (paragraphPart === '\r\n' || paragraphPart === '\n') {
        listText.push(
          <span key={`newline-${elementIndex++}`}>
            <br />
            <br />
          </span>
        );
        return;
      }

      if (paragraphPart === '') {
        return;
      }

      const wordMatches = paragraphPart.match(/(\S+|\s+)/g) || [];
      
      wordMatches.forEach((word) => {
        if (/^\s+$/.test(word)) {
          listText.push(
            <span key={`space-${elementIndex++}`}>{word}</span>
          );
          return;
        }

        const cleanWord = word.replace(/[.,!?;:'"()\[\]{}]+$/, '');

        if (ignoreShortWords > 0 && cleanWord.length <= ignoreShortWords) {
          listText.push(
            <span key={`word-${elementIndex++}`}>{word}</span>
          );
          return;
        }

        const mid = Math.floor(word.length * 3 / 5);

        if (isUnicode) {
          listText.push(
            <span key={`word-${elementIndex++}`}>
              {toUnicodeVariant(word.slice(0, mid), 'bold')}
              {word.slice(mid)}
            </span>
          );
        } else {
          listText.push(
            <span key={`word-${elementIndex++}`}>
              <span className='bio-letter'>{word.slice(0, mid)}</span>
              {word.slice(mid)}
            </span>
          );
        }
      });
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

  return {
    listPrepText,
    pretext,
    isDisabled,
    onClickButton,
    processData,
    onChangeTextarea,
    text,
  };
};
