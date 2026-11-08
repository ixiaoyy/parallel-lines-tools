import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Box } from '@mui/material';
import ToolContent from '@components/ToolContent';
import { GetGroupsType } from '@components/options/ToolOptions';
import { ToolComponentProps } from '@tools/defineTool';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { CardExampleType } from '@components/examples/ToolExamples';
import SelectWithDesc from '@components/options/SelectWithDesc';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { csvRowsToColumns } from './service';

const initialValues = {
  emptyValuesFilling: false,
  customFiller: 'x',
  commentCharacter: '//'
};
type InitialValuesType = typeof initialValues;

export default function CsvRowsToColumns({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('csv');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('csvRowsToColumns.title'),
      description: exampleText('exampleUi.inThisExampleWeTransformTheInputCsv'),
      sampleText: `a,b,c,d,e,f`,
      sampleResult: `a
b
c
d
e
f`,
      sampleOptions: {
        emptyValuesFilling: true,
        customFiller: '1',
        commentCharacter: '#'
      }
    },
    {
      title: exampleText('exampleUi.rowsToColumnsTransformation'),
      description: exampleText('exampleUi.inThisExampleWeLoadACsvFile'),
      sampleText: `Variety,Origin
Arabica,Ethiopia

Robusta,Africa
Liberica,Philippines

Mocha,Yemen
//green tea`,
      sampleResult: `Variety,Arabica,Robusta,Liberica,Mocha
Origin,Ethiopia,Africa,Philippines,Yemen`,
      sampleOptions: {
        emptyValuesFilling: true,
        customFiller: '1',
        commentCharacter: '//'
      }
    },
    {
      title: exampleText('exampleUi.fillMissingData'),
      description: exampleText('exampleUi.inThisExampleWeSwapRowsAndColumns'),
      sampleText: `Sport,Equipment,Players
Basketball,Ball,5
Football,Ball,11
Soccer,Ball,11
Baseball,Bat & Ball`,
      sampleResult: `Sport,Basketball,Football,Soccer,Baseball
Equipment,Ball,Ball,Ball,Bat & Ball
Players,5,11,11,NA`,
      sampleOptions: {
        emptyValuesFilling: false,
        customFiller: 'NA',
        commentCharacter: '#'
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('csv');

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: typeof initialValues, input: string) => {
    setResult(
      csvRowsToColumns(
        input,
        optionsValues.emptyValuesFilling,
        optionsValues.customFiller,
        optionsValues.commentCharacter
      )
    );
  };

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('inline.fixIncompleteData'),
      component: (
        <Box>
          <SelectWithDesc
            selected={values.emptyValuesFilling}
            options={[
              {
                label: inlineText('insertCsvColumns.fillWithEmptyValues'),
                value: true
              },
              {
                label: inlineText('insertCsvColumns.fillWithCustomValues'),
                value: false
              }
            ]}
            onChange={(value) => updateField('emptyValuesFilling', value)}
            description={inlineText('insertCsvColumns.customFillDescription')}
          />
          {!values.emptyValuesFilling && (
            <TextFieldWithDesc
              value={values.customFiller}
              onOwnChange={(val) => updateField('customFiller', val)}
              description={inlineText(
                'insertCsvColumns.customFillValueDescription'
              )}
            />
          )}
        </Box>
      )
    },
    {
      title: inlineText('inline.linesWithComments'),
      component: (
        <Box>
          <TextFieldWithDesc
            value={values.commentCharacter}
            onOwnChange={(val) => updateField('commentCharacter', val)}
            description={inlineText(
              'inline.enterTheSymbolIndicatingTheStartOf'
            )}
          />
        </Box>
      )
    }
  ];

  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={<ToolTextInput value={input} onChange={setInput} />}
      resultComponent={<ToolTextResult value={result} />}
      initialValues={initialValues}
      getGroups={getGroups}
      setInput={setInput}
      compute={compute}
      toolInfo={{ title: `What is a ${title}?`, description: longDescription }}
      exampleCards={exampleCards}
    />
  );
}
