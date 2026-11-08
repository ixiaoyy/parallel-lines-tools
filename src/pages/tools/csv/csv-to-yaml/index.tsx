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
import { main } from './service';
import { InitialValuesType } from './types';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';

const initialValues: InitialValuesType = {
  csvSeparator: ',',
  quoteCharacter: '"',
  commentCharacter: '#',
  emptyLines: true,
  headerRow: true,
  spaces: 2
};

export default function CsvToYaml({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('csv');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.convertMusicPlaylistCsvToYaml'),
      description: exampleText('exampleUi.inThisExampleWeTransformAShortCsv'),
      sampleText: `The Beatles,"Yesterday",Pop Rock
Queen,"Bohemian Rhapsody",Rock
Nirvana,"Smells Like Teen Spirit",Grunge
Michael Jackson,"Billie Jean",Pop
Stevie Wonder,"Superstition",Funk`,
      sampleResult: `-
  - The Beatles
  - Yesterday
  - Pop Rock
- 
  - Queen
  - Bohemian Rhapsody
  - Rock
- 
  - Nirvana
  - Smells Like Teen Spirit
  - Grunge
- 
  - Michael Jackson
  - Billie Jean
  - Pop
-
  - Stevie Wonder
  - Superstition
  - Funk`,
      sampleOptions: {
        ...initialValues,
        headerRow: false
      }
    },
    {
      title: exampleText('exampleUi.planetaryCsvData'),
      description: exampleText('exampleUi.inThisExampleWeAreWorkingWithCsv'),
      sampleText: `planet,relative mass,satellites
Venus,0.815,0
Earth,1.000,1
Mars,0.107,2`,
      sampleResult: `-
  planet: Venus
  relative mass: 0.815
  satellites: '0'
- 
  planet: Earth
  relative mass: 1.000
  satellites: '1'
- 
  planet: Mars
  relative mass: 0.107
  satellites: '2'`,
      sampleOptions: {
        ...initialValues
      }
    },
    {
      title: exampleText('exampleUi.convertNonStandardCsvToYaml'),
      description: exampleText('exampleUi.inThisExampleWeConvertACsvFile'),
      sampleText: `item;quantity;price
milk;2;3.50

#eggs;12;2.99
bread;1;4.25
#apples;4;1.99
cheese;1;8.99`,
      sampleResult: `-
  item: milk
  quantity: 2
  price: 3.50
-
  item: bread
  quantity: 1
  price: 4.25
-
  item: cheese
  quantity: 1
  price: 8.99`,
      sampleOptions: {
        ...initialValues,
        csvSeparator: ';'
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('csv');

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: InitialValuesType, input: string) => {
    setResult(main(input, optionsValues));
  };

  const getGroups: GetGroupsType<InitialValuesType> | null = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('inline.adjustCsvInput'),
      component: (
        <Box>
          <TextFieldWithDesc
            value={values.csvSeparator}
            onOwnChange={(val) => updateField('csvSeparator', val)}
            description={inlineText(
              'inline.enterTheCharacterUsedToDelimitColumns2'
            )}
          />
          <TextFieldWithDesc
            value={values.quoteCharacter}
            onOwnChange={(val) => updateField('quoteCharacter', val)}
            description={inlineText(
              'inline.enterTheQuoteCharacterUsedToQuote2'
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
      title: inlineText('csvToJson.conversionOptions'),
      component: (
        <Box>
          <CheckboxWithDesc
            checked={values.headerRow}
            onChange={(value) => updateField('headerRow', value)}
            title={inlineText('csvToJson.useHeaders')}
            description={inlineText('inline.keepTheFirstRowAsColumnNames')}
          />
          <CheckboxWithDesc
            checked={values.emptyLines}
            onChange={(value) => updateField('emptyLines', value)}
            title={inlineText('inline.ignoreLinesWithNoData')}
            description={inlineText(
              'inline.enableToPreventTheConversionOfEmpty'
            )}
          />
        </Box>
      )
    },
    {
      title: inlineText('inline.adjustYamlIndentation'),
      component: (
        <Box>
          <TextFieldWithDesc
            value={values.spaces}
            type="number"
            onOwnChange={(val) => updateField('spaces', Number(val))}
            inputProps={{ min: 1 }}
            description={inlineText('inline.setTheNumberOfSpacesToUse')}
          />
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
          title={inlineText('inline.outputYaml')}
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
