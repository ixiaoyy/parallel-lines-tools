import { useTranslation as useExampleTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { rot13 } from './service';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { useTranslation } from 'react-i18next';

type InitialValuesType = Record<string, never>;

const initialValues: InitialValuesType = {};

export default function Rot13({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.encodeAMessageWithRot13'),
      description: exampleText('exampleUi.thisExampleShowsHowToEncodeASimple2'),
      sampleText: 'Hello, World!',
      sampleResult: 'Uryyb, Jbeyq!',
      sampleOptions: {}
    },
    {
      title: exampleText('exampleUi.decodeARot13Message'),
      description: exampleText('exampleUi.thisExampleShowsHowToDecodeAMessage'),
      sampleText: 'Uryyb, Jbeyq!',
      sampleResult: 'Hello, World!',
      sampleOptions: {}
    }
  ];

  const { t } = useTranslation('string');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (_: InitialValuesType, input: string) => {
    if (input) setResult(rot13(input));
  };

  return (
    <ToolContent
      title={title}
      inputComponent={
        <ToolTextInput
          title={t('rot13.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult title={t('rot13.resultTitle')} value={result} />
      }
      initialValues={initialValues}
      getGroups={null}
      toolInfo={{
        title: t('rot13.toolInfo.title'),
        description: t('rot13.toolInfo.description')
      }}
      exampleCards={exampleCards}
      input={input}
      setInput={setInput}
      compute={compute}
    />
  );
}
