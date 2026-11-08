import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useState } from 'react';
import ToolContent from '@components/ToolContent';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { base64 } from './service';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { GetGroupsType } from '@components/options/ToolOptions';
import { Box } from '@mui/material';
import SimpleRadio from '@components/options/SimpleRadio';
import { InitialValuesType } from './types';
import { useTranslation } from 'react-i18next';

const initialValues: InitialValuesType = {
  mode: 'encode'
};

export default function Base64({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.encodeDataInUtf8WithBase64'),
      description: exampleText('exampleUi.thisExampleShowsHowToEncodeASimple'),
      sampleText: 'Hello, World!',
      sampleResult: 'SGVsbG8sIFdvcmxkIQ==',
      sampleOptions: { mode: 'encode' }
    },
    {
      title: exampleText('exampleUi.decodeBase64EncodedDataToUtf8'),
      description: exampleText('exampleUi.thisExampleShowsHowToDecodeDataThat'),
      sampleText: 'SGVsbG8sIFdvcmxkIQ==',
      sampleResult: 'Hello, World!',
      sampleOptions: { mode: 'decode' }
    }
  ];

  const { t } = useTranslation('string');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: InitialValuesType, input: string) => {
    if (input) setResult(base64(input, optionsValues.mode === 'encode'));
  };

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: t('base64.optionsTitle'),
      component: (
        <Box>
          <SimpleRadio
            onClick={() => updateField('mode', 'encode')}
            checked={values.mode === 'encode'}
            title={t('base64.encode')}
          />
          <SimpleRadio
            onClick={() => updateField('mode', 'decode')}
            checked={values.mode === 'decode'}
            title={t('base64.decode')}
          />
        </Box>
      )
    }
  ];

  return (
    <ToolContent
      title={title}
      inputComponent={
        <ToolTextInput
          title={t('base64.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult title={t('base64.resultTitle')} value={result} />
      }
      initialValues={initialValues}
      getGroups={getGroups}
      toolInfo={{
        title: t('base64.toolInfo.title'),
        description: t('base64.toolInfo.description')
      }}
      exampleCards={exampleCards}
      input={input}
      setInput={setInput}
      compute={compute}
    />
  );
}
