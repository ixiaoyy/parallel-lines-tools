import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { GetGroupsType } from '@components/options/ToolOptions';
import { CardExampleType } from '@components/examples/ToolExamples';
import { transposeCSV } from './service';
import { InitialValuesType } from './types';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import SelectWithDesc from '@components/options/SelectWithDesc';

const initialValues: InitialValuesType = {
  separator: ',',
  commentCharacter: '#',
  customFill: false,
  customFillValue: 'x',
  quoteChar: '"'
};

export default function TransposeCsv({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('csv');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.transposeA2x3Csv'),
      description: exampleText('exampleUi.thisExampleTransposesACsvWith2Rows'),
      sampleText: `foo,bar,baz
val1,val2,val3`,
      sampleResult: `foo,val1
bar,val2
baz,val3`,
      sampleOptions: {
        separator: ',',
        commentCharacter: '#',
        customFill: false,
        customFillValue: 'x',
        quoteChar: '"'
      }
    },
    {
      title: exampleText('exampleUi.transposeALongCsv'),
      description: exampleText('exampleUi.inThisExampleWeFlipAVerticalSingle'),
      sampleText: `Tasty Fruit
🍑 peaches
🍒 cherries
🥝 kiwis
🍓 strawberries
🍎 apples
🍐 pears
🥭 mangos
🍍 pineapples
🍌 bananas
🍊 tangerines
🍉 watermelons
🍇 grapes`,
      sampleResult: `fTasty Fruit,🍑 peaches,🍒 cherries,🥝 kiwis,🍓 strawberries,🍎 apples,🍐 pears,🥭 mangos,🍍 pineapples,🍌 bananas,🍊 tangerines,🍉 watermelons,🍇 grapes`,
      sampleOptions: {
        separator: ',',
        commentCharacter: '#',
        customFill: false,
        customFillValue: 'x',
        quoteChar: '"'
      }
    },
    {
      title: exampleText('exampleUi.cleanAndTransposeCsvData'),
      description: exampleText(
        'exampleUi.inThisExampleWePerformThreeTasksSimultaneously'
      ),
      sampleText: `Fish Type,Color,Habitat
Goldfish,Gold,Freshwater

#Clownfish,Orange,Coral Reefs
Tuna,Silver,Saltwater

Shark,Grey,Saltwater
Salmon,Silver`,
      sampleResult: `Fish Type,Goldfish,Tuna,Shark,Salmon
Color,Gold,Silver,Grey,Silver
Habitat,Freshwater,Saltwater,Saltwater,•`,
      sampleOptions: {
        separator: ',',
        commentCharacter: '#',
        customFill: true,
        customFillValue: '•',
        quoteChar: '"'
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('csv');

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (values: InitialValuesType, input: string) => {
    setResult(transposeCSV(input, values));
  };

  const getGroups: GetGroupsType<InitialValuesType> | null = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('findIncompleteCsvRecords.csvInputOptions'),
      component: (
        <Box>
          <TextFieldWithDesc
            value={values.separator}
            onOwnChange={(val) => updateField('separator', val)}
            description={inlineText(
              'findIncompleteCsvRecords.csvSeparatorDescription'
            )}
          />
          <TextFieldWithDesc
            value={values.quoteChar}
            onOwnChange={(val) => updateField('quoteChar', val)}
            description={inlineText(
              'findIncompleteCsvRecords.quoteCharacterDescription'
            )}
          />
          <TextFieldWithDesc
            value={values.commentCharacter}
            onOwnChange={(val) => updateField('commentCharacter', val)}
            description={inlineText(
              'findIncompleteCsvRecords.commentCharacterDescription'
            )}
          />
        </Box>
      )
    },
    {
      title: inlineText('inline.fixingCsvOptions'),
      component: (
        <Box>
          <SelectWithDesc
            selected={values.customFill}
            options={[
              {
                label: inlineText('insertCsvColumns.fillWithEmptyValues'),
                value: false
              },
              { label: inlineText('inline.fillWithCustomValues'), value: true }
            ]}
            onChange={(value) => updateField('customFill', value)}
            description={inlineText(
              'inline.insertEmptyFieldsOrCustomValuesWhere'
            )}
          />

          {values.customFill && (
            <TextFieldWithDesc
              value={values.customFillValue}
              onOwnChange={(val) => updateField('customFillValue', val)}
              description={inlineText(
                'inline.enterTheCharacterUsedToFillMissing'
              )}
            />
          )}
        </Box>
      )
    }
  ];
  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={
        <ToolTextInput
          title={inlineText('csvToJson.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult
          title={inlineText('inline.transposedCsv')}
          value={result}
        />
      }
      initialValues={initialValues}
      exampleCards={exampleCards}
      getGroups={getGroups}
      setInput={setInput}
      compute={compute}
      toolInfo={{ title: `What is a ${title}?`, description: longDescription }}
    />
  );
}
