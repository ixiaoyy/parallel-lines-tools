import { useTranslation as useExampleTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolCodeInput from '@components/input/ToolCodeInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { CardExampleType } from '@components/examples/ToolExamples';
import { validateJson } from './service';
import { ToolComponentProps } from '@tools/defineTool';
import ToolContent from '@components/ToolContent';
import { useTranslation } from 'react-i18next';
import { JsonFormat } from '@utils/json';

export default function ValidateJson({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('json');
  const exampleCards: CardExampleType<{}>[] = [
    {
      title: exampleText('exampleUi.validJsonObject'),
      description: exampleText(
        'exampleUi.thisExampleShowsACorrectlyFormattedJsonObject'
      ),
      sampleText: `{
  "name": "John",
  "age": 30,
  "city": "New York"
}`,
      sampleResult: '✅ Valid JSON',
      sampleOptions: {}
    },
    {
      title: exampleText('exampleUi.invalidJsonMissingQuotes'),
      description: exampleText(
        'exampleUi.thisExampleDemonstratesAnInvalidJsonObjectWhere'
      ),
      sampleText: `{
  name: "John",
  age: 30,
  city: "New York"
}`,
      sampleResult: "❌ Error: Expected property name or '}' in JSON",
      sampleOptions: {}
    },
    {
      title: exampleText('exampleUi.invalidJsonWithTrailingComma'),
      description: exampleText(
        'exampleUi.thisExampleShowsAnInvalidJsonObjectWith'
      ),
      sampleText: `{
  "name": "John",
  "age": 30,
  "city": "New York",
}`,
      sampleResult: '❌ Error: Expected double-quoted property name',
      sampleOptions: {}
    }
  ];

  const { t } = useTranslation('json');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [format, setFormat] = useState<JsonFormat | undefined>('json');

  const compute = (options: any, input: string) => {
    if (input) {
      const { valid, error, format } = validateJson(input);

      if (valid) {
        setResult(t('validateJson.validJson'));
        setFormat(format);
      } else {
        setResult(t('validateJson.invalidJson', { error }));
      }
    }
  };

  return (
    <ToolContent
      title={title}
      inputComponent={
        <ToolCodeInput
          title={t('validateJson.inputTitle')}
          value={input}
          onChange={setInput}
          language={format ? format : 'json'}
        />
      }
      resultComponent={
        <ToolTextResult title={t('validateJson.resultTitle')} value={result} />
      }
      initialValues={{}}
      getGroups={null}
      toolInfo={{
        title: t('validateJson.toolInfo.title'),
        description: t('validateJson.toolInfo.description')
      }}
      exampleCards={exampleCards}
      input={input}
      setInput={setInput}
      compute={compute}
    />
  );
}
