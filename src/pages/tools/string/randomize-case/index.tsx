import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { randomizeCase } from './service';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import ToolContent from '@components/ToolContent';

const initialValues = {};

export default function RandomizeCase({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<typeof initialValues>[] = [
    {
      title: exampleText('exampleUi.randomizeTextCase'),
      description: exampleText(
        'exampleUi.thisExampleTurnsNormalTextIntoARandom'
      ),
      sampleText: 'The quick brown fox jumps over the lazy dog.',
      sampleResult: 'tHe qUIcK BrOWn fOx JuMPs ovEr ThE LaZy Dog.',
      sampleOptions: {}
    },
    {
      title: exampleText('exampleUi.randomizeCodeCase'),
      description: exampleText(
        'exampleUi.transformCodeIdentifiersWithRandomizedCaseForA'
      ),
      sampleText:
        'function calculateTotal(price, quantity) { return price * quantity; }',
      sampleResult:
        'FuNcTIon cAlCuLAtEtOtaL(pRicE, qUaNTiTy) { rETuRn PrICe * QuAnTiTY; }',
      sampleOptions: {}
    },
    {
      title: exampleText('exampleUi.randomizeAFamousQuote'),
      description: exampleText(
        'exampleUi.giveAUniqueRandomizedCaseTreatmentToA'
      ),
      sampleText: 'To be or not to be, that is the question.',
      sampleResult: 'tO Be oR NoT To bE, ThAt iS ThE QueStIoN.',
      sampleOptions: {}
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('string');

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const computeExternal = (
    _optionsValues: typeof initialValues,
    input: string
  ) => {
    setResult(randomizeCase(input));
  };

  return (
    <ToolContent
      title={title}
      initialValues={initialValues}
      getGroups={null}
      compute={computeExternal}
      input={input}
      setInput={setInput}
      inputComponent={<ToolTextInput value={input} onChange={setInput} />}
      resultComponent={
        <ToolTextResult
          title={inlineText('inline.randomizedText')}
          value={result}
        />
      }
      exampleCards={exampleCards}
    />
  );
}
