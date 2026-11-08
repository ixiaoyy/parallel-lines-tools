import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import ToolCodeInput from '@components/input/ToolCodeInput';
import ToolCodeResult from '@components/result/ToolCodeResult';
import { stringifyJson } from './service';
import { ToolComponentProps } from '@tools/defineTool';
import RadioWithTextField from '@components/options/RadioWithTextField';
import SimpleRadio from '@components/options/SimpleRadio';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import { updateNumberField } from '@utils/string';
import { CardExampleType } from '@components/examples/ToolExamples';
import { InitialValuesType } from './types';
import { useTranslation } from 'react-i18next';

const initialValues: InitialValuesType = {
  indentationType: 'space',
  spacesCount: 2,
  escapeHtml: false
};

export default function StringifyJson({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('json');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.simpleObjectToJson'),
      description: exampleText(
        'exampleUi.convertABasicJavascriptObjectIntoAJson'
      ),
      sampleText: `{ name: "John", age: 30 }`,
      sampleResult: `{
  "name": "John",
  "age": 30
}`,
      sampleOptions: {
        indentationType: 'space',
        spacesCount: 2,
        escapeHtml: false
      }
    },
    {
      title: exampleText('exampleUi.arrayWithMixedTypes'),
      description: exampleText(
        'exampleUi.convertAnArrayContainingDifferentTypesOfValues'
      ),
      sampleText: `[1, "hello", true, null, { x: 10 }]`,
      sampleResult: `[
    1,
    "hello",
    true,
    null,
    {
        "x": 10
    }
]`,
      sampleOptions: {
        indentationType: 'space',
        spacesCount: 4,
        escapeHtml: false
      }
    },
    {
      title: exampleText('exampleUi.htmlEscapedJson'),
      description: exampleText(
        'exampleUi.convertAnObjectToJsonWithHtmlCharacters'
      ),
      sampleText: `{
  html: "<div>Hello & Welcome</div>",
  message: "Special chars: < > & ' \\""
}`,
      sampleResult: `{
  &quot;html&quot;: &quot;&lt;div&gt;Hello &amp; Welcome&lt;/div&gt;&quot;,
  &quot;message&quot;: &quot;Special chars: &lt; &gt; &amp; &#039; &quot;&quot;
}`,
      sampleOptions: {
        indentationType: 'space',
        spacesCount: 2,
        escapeHtml: true
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('json');

  const { t } = useTranslation('json');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (values: InitialValuesType, input: string) => {
    if (input) {
      try {
        setResult(stringifyJson(input, values));
      } catch (error) {
        setResult(
          `${
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
      input={input}
      setInput={setInput}
      initialValues={initialValues}
      compute={compute}
      exampleCards={exampleCards}
      inputComponent={
        <ToolCodeInput
          title={t('stringify.inputTitle')}
          value={input}
          onChange={setInput}
          language="json"
        />
      }
      resultComponent={
        <ToolCodeResult
          title={t('stringify.resultTitle')}
          value={result}
          language={'json'}
        />
      }
      getGroups={({ values, updateField }) => [
        {
          title: t('stringify.options.indentationTitle'),
          component: (
            <Box>
              <RadioWithTextField
                checked={values.indentationType === 'space'}
                title={t('stringify.options.useSpaceTitle')}
                fieldName="indentationType"
                description={t('stringify.options.useSpaceDesc')}
                value={values.spacesCount.toString()}
                onRadioClick={() => updateField('indentationType', 'space')}
                onTextChange={(val) =>
                  updateNumberField(val, 'spacesCount', updateField)
                }
              />
              <SimpleRadio
                onClick={() => updateField('indentationType', 'tab')}
                checked={values.indentationType === 'tab'}
                description={inlineText('stringify.options.useTabDesc')}
                title={t('stringify.options.useTabTitle')}
              />
            </Box>
          )
        },
        {
          title: t('stringify.options.optionsTitle'),
          component: (
            <CheckboxWithDesc
              checked={values.escapeHtml}
              onChange={(value) => updateField('escapeHtml', value)}
              title={t('stringify.options.escapeHtmlTitle')}
              description={t('stringify.options.escapeHtmlDesc')}
            />
          )
        }
      ]}
      toolInfo={{
        title: t('stringify.toolInfo.title'),
        description: t('stringify.toolInfo.description')
      }}
    />
  );
}
