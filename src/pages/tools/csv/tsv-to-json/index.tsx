import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import ToolCodeInput from '@components/input/ToolCodeInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { convertTsvToJson } from './service';
import { CardExampleType } from '@components/examples/ToolExamples';
import { GetGroupsType } from '@components/options/ToolOptions';
import { ToolComponentProps } from '@tools/defineTool';
import { Box } from '@mui/material';
import { updateNumberField } from '@utils/string';
import SimpleRadio from '@components/options/SimpleRadio';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { InitialValuesType } from './types';

const initialValues: InitialValuesType = {
  delimiter: '\t',
  quote: '"',
  comment: '#',
  useHeaders: true,
  skipEmptyLines: true,
  dynamicTypes: true,
  indentationType: 'space',
  spacesCount: 2
};

export default function TsvToJson({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('csv');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.basicTsvToJsonArray'),
      description: exampleText('exampleUi.convertASimpleTsvFileIntoAJson'),
      sampleText: `name	age	city
John	30	New York
Alice	25	London`,
      sampleResult: `[
  {
    "name": "John",
    "age": 30,
    "city": "New York"
  },
  {
    "name": "Alice",
    "age": 25,
    "city": "London"
  }
]`,
      sampleOptions: {
        ...initialValues,
        useHeaders: true,
        dynamicTypes: true
      }
    },
    {
      title: exampleText('exampleUi.turnTsvToJsonWithoutHeaders'),
      description: exampleText('exampleUi.convertATsvFileInMinifiedJsonFile'),
      sampleText: `Square	Triangle	Circle
Cube	Cone	Sphere
#Oval`,
      sampleResult: `[["Square","Triangle","Circle"],["Cube","Cone","Sphere"]]`,
      sampleOptions: {
        ...initialValues,
        useHeaders: false,
        indentationType: 'none'
      }
    },
    {
      title: exampleText('exampleUi.transformTsvToJsonWithHeaders'),
      description: exampleText('exampleUi.convertATsvFileWithHeadersIntoA'),
      sampleText: `item	material	quantity


Hat	Wool	3
Gloves	Leather	5
Candle	Wax	4
Vase	Glass	2

Sculpture	Bronze	1
Table	Wood	1

Bookshelf	Wood	2`,
      sampleResult: `[
  {
    "item": "Hat",
    "material": "Wool",
    "quantity": 3
  },
  {
    "item": "Gloves",
    "material": "Leather",
    "quantity": 5
  },
  {
    "item": "Candle",
    "material": "Wax",
    "quantity": 4
  },
  {
    "item": "Vase",
    "material": "Glass",
    "quantity": 2
  },
  {
    "item": "Sculpture",
    "material": "Bronze",
    "quantity": 1
  },
  {
    "item": "Table",
    "material": "Wood",
    "quantity": 1
  },
  {
    "item": "Bookshelf",
    "material": "Wood",
    "quantity": 2
  }
]`,
      sampleOptions: {
        ...initialValues
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('csv');

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (values: InitialValuesType, input: string) => {
    setResult(convertTsvToJson(input, values));
  };

  const getGroups: GetGroupsType<InitialValuesType> | null = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('csvToJson.inputCsvFormat'),
      component: (
        <Box>
          <TextFieldWithDesc
            description={inlineText('inline.characterUsedToQutoeTsvValues')}
            onOwnChange={(val) => updateField('quote', val)}
            value={values.quote}
          />
          <TextFieldWithDesc
            description={inlineText('inline.symbolUseToMarkCommentsInThe')}
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
            description={inlineText('inline.firstRowIsTreatedAsColumnHeaders')}
          />
          <CheckboxWithDesc
            checked={values.dynamicTypes}
            onChange={(value) => updateField('dynamicTypes', value)}
            title={inlineText('csvToJson.dynamicTypes')}
            description={inlineText(
              'inline.convertNumbersAndBooleansToTheirProper'
            )}
          />
        </Box>
      )
    },
    {
      title: inlineText('inline.outputFormatting'),
      component: (
        <Box>
          <SimpleRadio
            onClick={() => updateField('indentationType', 'space')}
            checked={values.indentationType === 'space'}
            title={inlineText('inline.useSpacesForIndentation')}
          />
          {values.indentationType === 'space' && (
            <TextFieldWithDesc
              description={inlineText('inline.numberOfSpacesForIndentation')}
              value={values.spacesCount}
              onOwnChange={(val) =>
                updateNumberField(val, 'spacesCount', updateField)
              }
              type="number"
            />
          )}
          <SimpleRadio
            onClick={() => updateField('indentationType', 'tab')}
            checked={values.indentationType === 'tab'}
            title={inlineText('inline.useTabsForIndentation')}
          />
          <SimpleRadio
            onClick={() => updateField('indentationType', 'none')}
            checked={values.indentationType === 'none'}
            title={inlineText('inline.minifyJson')}
          />
        </Box>
      )
    }
  ];

  return (
    <ToolContent
      title={title}
      input={input}
      setInput={setInput}
      initialValues={initialValues}
      compute={compute}
      exampleCards={exampleCards}
      getGroups={getGroups}
      inputComponent={
        <ToolCodeInput
          title={inlineText('inline.inputTsv')}
          value={input}
          onChange={setInput}
          language="tsv"
        />
      }
      resultComponent={
        <ToolTextResult
          title={inlineText('csvToJson.resultTitle')}
          value={result}
          extension={'json'}
        />
      }
      toolInfo={{ title: `What is a ${title}?`, description: longDescription }}
    />
  );
}
