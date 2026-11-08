import { useTranslation as useExampleTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { UppercaseInput } from './service';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import ToolContent from '@components/ToolContent';
import { useTranslation } from 'react-i18next';

const initialValues = {};

export default function Uppercase({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<typeof initialValues>[] = [
    {
      title: exampleText('exampleUi.convertTextToUppercase'),
      description: exampleText(
        'exampleUi.thisExampleTransformsAnyTextToAllUppercase'
      ),
      sampleText: 'The quick brown fox jumps over the lazy dog.',
      sampleResult: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG.',
      sampleOptions: {}
    },
    {
      title: exampleText('exampleUi.uppercaseCode'),
      description: exampleText(
        'exampleUi.convertCodeToUppercaseFormatNoteThatThis'
      ),
      sampleText: 'function example() { return "hello world"; }',
      sampleResult: 'FUNCTION EXAMPLE() { RETURN "HELLO WORLD"; }',
      sampleOptions: {}
    },
    {
      title: exampleText('exampleUi.mixedCaseToUppercase'),
      description: exampleText(
        'exampleUi.transformTextWithMixedCasingToConsistentAll'
      ),
      sampleText: 'ThIs Is MiXeD CaSe TeXt!',
      sampleResult: 'THIS IS MIXED CASE TEXT!',
      sampleOptions: {}
    }
  ];

  const { t } = useTranslation('string');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const computeExternal = (
    _optionsValues: typeof initialValues,
    input: string
  ) => {
    setResult(UppercaseInput(input));
  };

  return (
    <ToolContent
      title={title}
      initialValues={initialValues}
      getGroups={null}
      compute={computeExternal}
      input={input}
      setInput={setInput}
      inputComponent={
        <ToolTextInput
          title={t('uppercase.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult title={t('uppercase.resultTitle')} value={result} />
      }
      exampleCards={exampleCards}
    />
  );
}
