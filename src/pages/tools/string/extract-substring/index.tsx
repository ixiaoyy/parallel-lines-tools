import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { GetGroupsType } from '@components/options/ToolOptions';
import { extractSubstring } from './service';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import ToolContent from '@components/ToolContent';

const initialValues = {
  start: '1',
  length: '5',
  multiLine: false,
  reverse: false
};

export default function ExtractSubstring({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<typeof initialValues>[] = [
    {
      title: exampleText('exampleUi.extractFirst5Characters'),
      description: exampleText(
        'exampleUi.thisExampleExtractsTheFirst5CharactersFrom'
      ),
      sampleText: 'The quick brown fox jumps over the lazy dog.',
      sampleResult: 'The q',
      sampleOptions: {
        ...initialValues,
        start: '1',
        length: '5'
      }
    },
    {
      title: exampleText('exampleUi.extractWordsFromTheMiddle'),
      description: exampleText(
        'exampleUi.extractASubstringStartingFromPosition11With'
      ),
      sampleText: 'The quick brown fox jumps over the lazy dog.',
      sampleResult: 'brown fox',
      sampleOptions: {
        ...initialValues,
        start: '11',
        length: '10'
      }
    },
    {
      title: exampleText('exampleUi.multiLineExtractionWithReversal'),
      description: exampleText('exampleUi.extractCharacters13FromEachLineAnd'),
      sampleText: 'First line\nSecond line\nThird line',
      sampleResult: 'riF\nceS\nihT',
      sampleOptions: {
        ...initialValues,
        start: '1',
        length: '3',
        multiLine: true,
        reverse: true
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation(['string', 'translation']);

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const computeExternal = (
    optionsValues: typeof initialValues,
    input: string
  ) => {
    const { start, length, multiLine, reverse } = optionsValues;
    try {
      setResult(
        extractSubstring(
          input,
          parseInt(start, 10),
          parseInt(length, 10),
          multiLine,
          reverse
        )
      );
    } catch (error) {
      if (error instanceof Error) {
        setResult(
          inlineText('translation:common.error', {
            error: String(error.message)
          })
        );
      } else {
        setResult(inlineText('inline.anUnknownErrorOccurred'));
      }
    }
  };

  const getGroups: GetGroupsType<typeof initialValues> = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('emailExtractor.options.title'),
      component: [
        <TextFieldWithDesc
          key="start"
          value={values.start}
          onOwnChange={(value) => updateField('start', value)}
          description={inlineText('inline.startPosition1BasedIndex')}
          type="number"
        />,
        <TextFieldWithDesc
          key="length"
          value={values.length}
          onOwnChange={(value) => updateField('length', value)}
          description={inlineText('inline.numberOfCharactersToExtract')}
          type="number"
        />,
        <CheckboxWithDesc
          key="multiLine"
          checked={values.multiLine}
          title={inlineText('reverse.processMultiLine')}
          description={inlineText('inline.extractFromEachLineIndependently')}
          onChange={(val) => updateField('multiLine', val)}
        />,
        <CheckboxWithDesc
          key="reverse"
          checked={values.reverse}
          title={inlineText('inline.reverseOutput')}
          description={inlineText('inline.reverseTheExtractedSubstring')}
          onChange={(val) => updateField('reverse', val)}
        />
      ]
    }
  ];

  return (
    <ToolContent
      title={title}
      initialValues={initialValues}
      getGroups={getGroups}
      compute={computeExternal}
      input={input}
      setInput={setInput}
      inputComponent={
        <ToolTextInput
          title={inlineText('quote.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult
          title={inlineText('inline.extractedText')}
          value={result}
        />
      }
      exampleCards={exampleCards}
    />
  );
}
