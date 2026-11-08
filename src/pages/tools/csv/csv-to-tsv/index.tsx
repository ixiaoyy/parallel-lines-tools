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
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { csvToTsv } from './service';

const initialValues = {
  delimiter: ',',
  quoteCharacter: '"',
  commentCharacter: '#',
  header: true,
  emptyLines: true
};
type InitialValuesType = typeof initialValues;

export default function CsvToTsv({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('csv');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.convertGameDataFromTheCsvFormatTo'),
      description: exampleText(
        'exampleUi.inThisExampleWeTransformACommaSeparated'
      ),
      sampleText: `player_name,score,time,goals
ToniJackson,2500,30:00,15
HenryDalton,1800,25:00,12
DavidLee,3200,40:00,20
EmmaJones,2100,35:00,17
KrisDavis,1500,20:00,10`,
      sampleResult: `player_name	score	time	goals
ToniJackson	2500	30:00	15
HenryDalton	1800	25:00	12
DavidLee	3200	40:00	20
EmmaJones	2100	35:00	17
KrisDavis	1500	20:00	10`,
      sampleOptions: {
        delimiter: ',',
        quoteCharacter: '"',
        commentCharacter: '#',
        header: true,
        emptyLines: true
      }
    },
    {
      title: exampleText('exampleUi.mythicalCreatures'),
      description: exampleText('exampleUi.inThisExampleWeLoadACsvFile'),
      sampleText: `creature;origin;habitat;powers
Unicorn;Mythology;Forest;Magic horn
Mermaid;Mythology;Ocean;Hypnotic singing
Vampire;Mythology;Castles;Immortality
Phoenix;Mythology;Desert;Rebirth from ashes

#Dragon;Mythology;Mountains;Fire breathing
#Werewolf;Mythology;Forests;Shape shifting`,
      sampleResult: `Unicorn	Mythology	Forest	Magic horn
Mermaid	Mythology	Ocean	Hypnotic singing
Vampire	Mythology	Castles	Immortality
Phoenix	Mythology	Desert	Rebirth from ashes`,
      sampleOptions: {
        delimiter: ';',
        quoteCharacter: '"',
        commentCharacter: '#',
        header: false,
        emptyLines: true
      }
    },
    {
      title: exampleText('exampleUi.convertFitnessTrackerDataFromCsvToTsv'),
      description: exampleText('exampleUi.inThisExampleWeSwapRowsAndColumns'),
      sampleText: `day,steps,distance,calories

Mon,7500,3.75,270
Tue,12000,6.00,420

Wed,8000,4.00,300
Thu,9500,4.75,330
Fri,10000,5.00,350`,
      sampleResult: `day	steps	distance	calories
Mon	7500	3.75	270
Tue	12000	6.00	420
Wed	8000	4.00	300
Thu	9500	4.75	330
Fri	10000	5.00	350`,
      sampleOptions: {
        delimiter: ',',
        quoteCharacter: '"',
        commentCharacter: '#',
        header: true,
        emptyLines: true
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('csv');

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: typeof initialValues, input: string) => {
    setResult(
      csvToTsv(
        input,
        optionsValues.delimiter,
        optionsValues.quoteCharacter,
        optionsValues.commentCharacter,
        optionsValues.header,
        optionsValues.emptyLines
      )
    );
  };

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('inline.csvFormatOptions'),
      component: (
        <Box>
          <TextFieldWithDesc
            value={values.delimiter}
            onOwnChange={(val) => updateField('delimiter', val)}
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
            checked={values.header}
            onChange={(value) => updateField('header', value)}
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
