import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import ToolCodeInput from '@components/input/ToolCodeInput';
import ToolCodeResult from '@components/result/ToolCodeResult';
import { sortJson } from './service';
import { CardExampleType } from '@components/examples/ToolExamples';
import SelectWithDesc from '@components/options/SelectWithDesc';
import { ToolComponentProps } from '@tools/defineTool';
import ToolContent from '@components/ToolContent';
import { InitialValuesType } from './types';
import { GetGroupsType } from '@components/options/ToolOptions';
import { getJsonHeaders } from '@utils/json';
import { useTranslation } from 'react-i18next';
import { JsonFormat } from '@utils/json';

const initialValues: InitialValuesType = {
  mode: 'value',
  key: '',
  order: 'asc'
};

export default function SortJson({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('json');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.sortByNameAscending'),
      description: exampleText(
        'exampleUi.sortAJsonArrayOfObjectsAlphabeticallyBy'
      ),
      sampleText: `[{"name":"Charlie","age":30},{"name":"Alice","age":25},{"name":"Bob","age":35}]`,
      sampleResult: `[
  {
    "name": "Alice",
    "age": 25
  },
  {
    "name": "Bob",
    "age": 35
  },
  {
    "name": "Charlie",
    "age": 30
  }
]`,
      sampleOptions: { mode: 'value', key: 'name', order: 'asc' }
    },
    {
      title: exampleText('sortJson.options.sortByKey'),
      description: exampleText(
        'exampleUi.sortTheKeysOfAJsonObjectAlphabetically'
      ),
      sampleText: `{"zebra":1,"apple":2,"mango":3}`,
      sampleResult: `{
  "apple": 2,
  "mango": 3,
  "zebra": 1
}`,
      sampleOptions: { mode: 'key', key: '', order: 'asc' }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('json');

  const { t } = useTranslation('json');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [format, setFormat] = useState<JsonFormat>('json');

  const compute = (values: InitialValuesType, input: string) => {
    if (input) {
      try {
        const { result, format } = sortJson(input, values);
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

  const keys = getJsonHeaders(input);
  const keyOptions =
    keys.length > 0
      ? keys.map((item) => ({
          label: item,
          value: item
        }))
      : [];

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: t('sortJson.options.title'),
      component: (
        <Box>
          <SelectWithDesc
            selected={values.mode}
            options={[
              {
                label: t('sortJson.options.sortByValue'),
                value: 'value'
              },
              {
                label: t('sortJson.options.sortByKey'),
                value: 'key'
              }
            ]}
            onChange={(value) => {
              updateField('mode', value);
              updateField('key', '');
            }}
            description={t('sortJson.options.modeDescription')}
          />
          {values.mode === 'value' && (
            <SelectWithDesc
              selected={values.key}
              options={[
                { label: inlineText('inline.pleaseSelectAKey'), value: '' },
                ...keyOptions
              ]}
              onChange={(value) => updateField('key', value)}
              description={t('sortJson.options.keyDescription')}
            />
          )}
          <SelectWithDesc
            selected={values.order}
            options={[
              {
                label: t('sortJson.options.ascending'),
                value: 'asc'
              },
              {
                label: t('sortJson.options.descending'),
                value: 'desc'
              }
            ]}
            onChange={(value) => updateField('order', value)}
            description={t('sortJson.options.orderDescription')}
          />
        </Box>
      )
    }
  ];

  return (
    <ToolContent
      title={title}
      inputComponent={
        <ToolCodeInput
          title={t('sortJson.inputTitle')}
          value={input}
          onChange={setInput}
          language={format}
        />
      }
      resultComponent={
        <ToolCodeResult
          title={t('sortJson.resultTitle')}
          value={result}
          language={format}
        />
      }
      initialValues={initialValues}
      getGroups={getGroups}
      compute={compute}
      input={input}
      setInput={setInput}
      exampleCards={exampleCards}
      toolInfo={{ title: `What is a ${title}?`, description: longDescription }}
    />
  );
}
