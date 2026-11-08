import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { convertCsvToXml } from './service';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { Box } from '@mui/material';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { InitialValuesType } from './types';

const initialValues: InitialValuesType = {
  delimiter: ',',
  quote: '"',
  comment: '#',
  useHeaders: true,
  skipEmptyLines: true
};

export default function CsvToXml({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('csv');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.basicCsvToXml'),
      description: exampleText('exampleUi.convertASimpleCsvFileIntoAnXml'),
      sampleText: 'name,age,city\nJohn,30,New York\nAlice,25,London',
      sampleResult: `<root>
  <row>
    <name>John</name>
    <age>30</age>
    <city>New York</city>
  </row>
  <row>
    <name>Alice</name>
    <age>25</age>
    <city>London</city>
  </row>
</root>`,
      sampleOptions: {
        ...initialValues,
        useHeaders: true
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation(['csv', 'translation']);

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (values: InitialValuesType, input: string) => {
    if (input) {
      try {
        const xmlResult = convertCsvToXml(input, values);
        setResult(xmlResult);
      } catch (error) {
        setResult(
          inlineText('translation:common.error', {
            error: String(
              error instanceof Error
                ? error.message
                : inlineText('inline.invalidCsvFormat')
            )
          })
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
        <ToolTextInput
          title={inlineText('csvToJson.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult
          title={inlineText('inline.outputXml')}
          value={result}
          extension={'xml'}
        />
      }
      getGroups={({ values, updateField }) => [
        {
          title: inlineText('csvToJson.inputCsvFormat'),
          component: (
            <Box>
              <TextFieldWithDesc
                description={inlineText('inline.columnSeparator')}
                value={values.delimiter}
                onOwnChange={(val) => updateField('delimiter', val)}
              />
              <TextFieldWithDesc
                description={inlineText('inline.fieldQuote')}
                onOwnChange={(val) => updateField('quote', val)}
                value={values.quote}
              />
              <TextFieldWithDesc
                description={inlineText('inline.commentSymbol')}
                value={values.comment}
                onOwnChange={(val) => updateField('comment', val)}
              />
            </Box>
          )
        },
        {
          title: inlineText('csvToJson.conversionOptions'),
          component: (
            <Box>
              <CheckboxWithDesc
                checked={values.useHeaders}
                onChange={(value) => updateField('useHeaders', value)}
                title={inlineText('csvToJson.useHeaders')}
                description={inlineText(
                  'inline.firstRowIsTreatedAsColumnHeaders'
                )}
              />
              <CheckboxWithDesc
                checked={values.skipEmptyLines}
                onChange={(value) => updateField('skipEmptyLines', value)}
                title={inlineText('csvToJson.skipEmptyLines')}
                description={inlineText('inline.donTProcessEmptyLinesInThe')}
              />
            </Box>
          )
        }
      ]}
    />
  );
}
