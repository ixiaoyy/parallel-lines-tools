import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import ToolCodeInput from '@components/input/ToolCodeInput';
import ToolCodeResult from '@components/result/ToolCodeResult';
import { minifyJson } from './service';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { useTranslation } from 'react-i18next';
import { JsonFormat } from '@utils/json';

type InitialValuesType = Record<string, never>;

const initialValues: InitialValuesType = {};

export default function MinifyJson({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('json');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.minifyASimpleJsonObject'),
      description: exampleText('exampleUi.thisExampleShowsHowToMinifyASimple'),
      sampleText: `{
  "name": "John Doe",
  "age": 30,
  "city": "New York"
}`,
      sampleResult: `{"name":"John Doe","age":30,"city":"New York"}`,
      sampleOptions: {}
    },
    {
      title: exampleText('exampleUi.minifyANestedJsonStructure'),
      description: exampleText(
        'exampleUi.thisExampleDemonstratesMinificationOfAComplexNested'
      ),
      sampleText: `{
  "users": [
    {
      "id": 1,
      "name": "Alice",
      "hobbies": ["reading", "gaming"]
    },
    {
      "id": 2,
      "name": "Bob",
      "hobbies": ["swimming", "coding"]
    }
  ]
}`,
      sampleResult: `{"users":[{"id":1,"name":"Alice","hobbies":["reading","gaming"]},{"id":2,"name":"Bob","hobbies":["swimming","coding"]}]}`,
      sampleOptions: {}
    }
  ];

  // 校验提示仅做语言接线，规则和数据处理保持不变。
  const { t: inlineText } = useInlineTranslation('json');

  const { t } = useTranslation('json');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [format, setFormat] = useState<JsonFormat>('json');

  const compute = (_: InitialValuesType, input: string) => {
    if (input) {
      try {
        const { result, format } = minifyJson(input);
        setResult(result);
        setFormat(format);
      } catch (error) {
        setResult(
          ` ${
            error instanceof Error
              ? error.message
              : inlineText('inline.invalidJsonFormat')
          }`
        );
      }
    }
  };

  return (
    <ToolContent
      title={title}
      inputComponent={
        <ToolCodeInput
          title={t('minify.inputTitle')}
          value={input}
          onChange={setInput}
          language={format}
        />
      }
      resultComponent={
        <ToolCodeResult
          title={t('minify.resultTitle')}
          value={result}
          language={format}
        />
      }
      initialValues={initialValues}
      getGroups={null}
      toolInfo={{
        title: t('minify.toolInfo.title'),
        description: t('minify.toolInfo.description')
      }}
      exampleCards={exampleCards}
      input={input}
      setInput={setInput}
      compute={compute}
    />
  );
}
