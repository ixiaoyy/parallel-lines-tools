import { useTranslation as useExampleTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { CardExampleType } from '@components/examples/ToolExamples';
import { validateXml } from './service';
import { InitialValuesType } from './types';
import { useTranslation } from 'react-i18next';

const initialValues: InitialValuesType = {};

export default function XmlValidator({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('xml');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.validateXml'),
      description: exampleText('exampleUi.checkIfAnXmlStringIsWellFormed'),
      sampleText: '<root><item>1</item><item>2</item></root>',
      sampleResult: 'Valid XML',
      sampleOptions: {}
    },
    {
      title: exampleText('exampleUi.invalidXml'),
      description: exampleText('exampleUi.exampleOfMalformedXml'),
      sampleText: '<root><item>1</item><item>2</root>',
      sampleResult: 'Invalid XML: ...',
      sampleOptions: {}
    }
  ];

  const { t } = useTranslation('xml');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (_values: InitialValuesType, input: string) => {
    setResult(validateXml(input, {}));
  };

  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={
        <ToolTextInput
          value={input}
          onChange={setInput}
          placeholder={t('xmlValidator.placeholder')}
        />
      }
      resultComponent={<ToolTextResult value={result} extension="txt" />}
      initialValues={initialValues}
      exampleCards={exampleCards}
      getGroups={null}
      setInput={setInput}
      compute={compute}
      toolInfo={{
        title: t('xmlValidator.toolInfo.title'),
        description: t('xmlValidator.toolInfo.description')
      }}
    />
  );
}
