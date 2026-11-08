import { useTranslation as useExampleTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { GetGroupsType } from '@components/options/ToolOptions';
import { reverseList, SplitOperatorType } from './service';
import SimpleRadio from '@components/options/SimpleRadio';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import ToolContent from '@components/ToolContent';
import { useTranslation } from 'react-i18next';

const initialValues = {
  splitOperatorType: 'symbol' as SplitOperatorType,
  splitSeparator: ',',
  joinSeparator: '\\n'
};
type InitialValuesType = typeof initialValues;
const splitOperators: {
  title: string;
  description: string;
  type: SplitOperatorType;
}[] = [
  {
    title: 'Use a Symbol for Splitting',
    description: 'Delimit input list items with a character.',
    type: 'symbol'
  },
  {
    title: 'Use a Regex for Splitting',
    type: 'regex',
    description: 'Delimit input list items with a regular expression.'
  }
];

export default function Reverse({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('list');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.reverseAListOfDigits'),
      description: exampleText('exampleUi.inThisExampleWeLoadAListOf'),
      sampleText: `2, 9, 6; 3; 7. 4. 4. 2, 1; 4, 8. 4; 4. 8, 2, 5; 1; 7; 7. 0`,
      sampleResult: `0; 7; 7; 1; 5; 2; 8; 4; 4; 8; 4; 1; 2; 4; 4; 7; 3; 6; 9; 2`,
      sampleOptions: {
        splitOperatorType: 'regex',
        splitSeparator: '[;,.]\\s*',
        joinSeparator: '; '
      }
    },
    {
      title: exampleText('exampleUi.reverseAColumnOfWords'),
      description: exampleText(
        'exampleUi.thisExampleReversesAColumnOfTwentyThree'
      ),
      sampleText: `argument
pollution
emphasis
vehicle
family
property
preference
studio
suggestion
accident
analyst
permission
reaction
promotion
quantity
inspection
chemistry
conclusion
confusion
memory`,
      sampleResult: `memory
confusion
conclusion
chemistry
inspection
quantity
promotion
reaction
permission
analyst
accident
suggestion
studio
preference
property
family
vehicle
emphasis
pollution
argument`,
      sampleOptions: {
        splitOperatorType: 'symbol',
        splitSeparator: '\\n',
        joinSeparator: '\\n'
      }
    },
    {
      title: exampleText('exampleUi.reverseARandomList'),
      description: exampleText(
        'exampleUi.inThisExampleTheListElementsAreRandom'
      ),
      sampleText: `Hamburg-21334-Dhaka-Sunny-Managua-Rainy-Chongqing-95123-Oakland`,
      sampleResult: `Oakland, 95123, Chongqing, Rainy, Managua, Sunny, Dhaka, 21334, Hamburg`,
      sampleOptions: {
        splitOperatorType: 'symbol',
        splitSeparator: '-',
        joinSeparator: ', '
      }
    }
  ];

  const { t } = useTranslation('list');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: t('reverse.splitterMode'),
      component: (
        <Box>
          {splitOperators.map(({ title, description, type }) => (
            <SimpleRadio
              key={type}
              onClick={() => updateField('splitOperatorType', type)}
              title={t(`reverse.splitOperators.${type}.title`)}
              description={t(`reverse.splitOperators.${type}.description`)}
              checked={values.splitOperatorType === type}
            />
          ))}
        </Box>
      )
    },
    {
      title: t('reverse.itemSeparator'),
      component: (
        <Box>
          <TextFieldWithDesc
            description={t('reverse.itemSeparatorDescription')}
            value={values.splitSeparator}
            onOwnChange={(val) => updateField('splitSeparator', val)}
          />
        </Box>
      )
    },
    {
      title: t('reverse.outputListOptions'),
      component: (
        <Box>
          <TextFieldWithDesc
            description={t('reverse.outputSeparatorDescription')}
            value={values.joinSeparator}
            onOwnChange={(val) => updateField('joinSeparator', val)}
          />
        </Box>
      )
    }
  ];
  const compute = (optionsValues: typeof initialValues, input: any) => {
    const { splitOperatorType, splitSeparator, joinSeparator } = optionsValues;

    setResult(
      reverseList(splitOperatorType, splitSeparator, joinSeparator, input)
    );
  };

  return (
    <ToolContent
      title={title}
      initialValues={initialValues}
      getGroups={getGroups}
      compute={compute}
      input={input}
      setInput={setInput}
      inputComponent={
        <ToolTextInput
          title={t('reverse.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult title={t('reverse.resultTitle')} value={result} />
      }
      toolInfo={{
        title: t('reverse.toolInfo.title'),
        description: t('reverse.toolInfo.description')
      }}
      exampleCards={exampleCards}
    />
  );
}
