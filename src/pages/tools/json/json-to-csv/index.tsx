import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import { useState } from 'react';
import ToolContent from '@components/ToolContent';
import ToolCodeInput from '@components/input/ToolCodeInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { convertJsonToCsv } from './service';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { Box } from '@mui/material';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import SimpleRadio from '@components/options/SimpleRadio';
import { InitialValuesType } from './types';
import { useTranslation } from 'react-i18next';
import { JsonFormat } from 'utils/json';

const initialValues: InitialValuesType = {
  delimiter: ',',
  includeHeaders: true,
  quoteStrings: 'auto'
};

export default function JsonToCsv({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('json');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.arrayOfObjects'),
      description: exampleText(
        'exampleUi.convertMultipleJsonObjectsIntoCsvRowsOne'
      ),
      sampleText: `[
  { "name": "John Doe", "age": 25, "city": "New York" },
  { "name": "Jane Doe", "age": 30, "city": "Los Angeles" },
  { "name": "Bob Smith", "age": 22, "city": "Chicago" }
]`,
      sampleResult: `name,age,city\nJohn Doe,25,New York\nJane Doe,30,Los Angeles\nBob Smith,22,Chicago`,
      sampleOptions: {
        ...initialValues
      }
    },
    {
      title: exampleText('exampleUi.nestedObjectDotNotation'),
      description: exampleText(
        'exampleUi.nestedKeysAreFlattenedUsingDotNotationE'
      ),
      sampleText: `[
  {
    "name": "John Doe",
    "age": 25,
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001"
    },
    "hobbies": ["reading", "running"]
  }
]`,
      sampleResult: `name,age,address.street,address.city,address.state,address.postalCode,hobbies[0],hobbies[1]\nJohn Doe,25,123 Main St,New York,NY,10001,reading,running`,
      sampleOptions: {
        ...initialValues
      }
    },
    {
      title: exampleText('exampleUi.sparseRows'),
      description: exampleText(
        'exampleUi.missingKeysAreFilledWithEmptyValuesTo'
      ),
      sampleText: `[
  { "name": "Alice", "age": 30 },
  { "name": "Bob", "city": "Paris" },
  { "name": "Carol", "age": 25, "city": "Rome" }
]`,
      sampleResult: `name,age,city\nAlice,30,\nBob,,Paris\nCarol,25,Rome`,
      sampleOptions: {
        ...initialValues
      }
    }
  ];

  // 校验提示仅做语言接线，规则和数据处理保持不变。
  const { t: inlineText } = useInlineTranslation('json');

  const { t } = useTranslation('json');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [inputFormat, setInputFormat] = useState<JsonFormat>('json');

  const compute = (values: InitialValuesType, input: string) => {
    if (input) {
      try {
        const { result, inputFormat } = convertJsonToCsv(input, values);
        setResult(result);
        setInputFormat(inputFormat);
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
      input={input}
      setInput={setInput}
      initialValues={initialValues}
      compute={compute}
      exampleCards={exampleCards}
      inputComponent={
        <ToolCodeInput
          title={t('jsonToCsv.inputTitle')}
          value={input}
          onChange={setInput}
          language={inputFormat}
        />
      }
      resultComponent={
        <ToolTextResult
          title={t('jsonToCsv.outputTitle')}
          value={result}
          extension={'csv'}
        />
      }
      getGroups={({ values, updateField }) => [
        {
          title: t('jsonToCsv.delimiterOption'),
          component: (
            <Box>
              <TextFieldWithDesc
                description={t('jsonToCsv.options.delimiter')}
                value={values.delimiter}
                onOwnChange={(val) => updateField('delimiter', val)}
              />
            </Box>
          )
        },
        {
          title: t('jsonToCsv.quotingOption'),
          component: (
            <Box>
              <SimpleRadio
                checked={values.quoteStrings === 'auto'}
                title={t('jsonToCsv.options.autoQuote.label')}
                description={t('jsonToCsv.options.autoQuote.description')}
                onClick={() => updateField('quoteStrings', 'auto')}
              />
              <SimpleRadio
                checked={values.quoteStrings === 'always'}
                title={t('jsonToCsv.options.alwaysQuote.label')}
                description={t('jsonToCsv.options.alwaysQuote.description')}
                onClick={() => updateField('quoteStrings', 'always')}
              />
            </Box>
          )
        },
        {
          title: t('jsonToCsv.headerOption'),
          component: (
            <Box>
              <CheckboxWithDesc
                checked={values.includeHeaders}
                onChange={(value) => updateField('includeHeaders', value)}
                title={t('jsonToCsv.options.header.label')}
                description={t('jsonToCsv.options.header.description')}
              />
            </Box>
          )
        }
      ]}
    />
  );
}
