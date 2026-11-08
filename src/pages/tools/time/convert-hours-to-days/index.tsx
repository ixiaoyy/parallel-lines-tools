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
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { convertHoursToDays } from './service';

const initialValues = {
  daysFlag: false,
  accuracy: '1'
};
type InitialValuesType = typeof initialValues;

export default function ConvertDaysToHours({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('time');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.hoursToIntegerDays'),
      description: exampleText('exampleUi.inThisExampleWeConvertTenHourValues'),
      sampleText: `24 hours
48 hours
72 hours
96 hours
120 hours
144 hours
168 hours
192 hours
216 hours
240 hours`,
      sampleResult: `1 day
2 days
3 days
4 days
5 days
6 days
7 days
8 days
9 days
10 days`,
      sampleOptions: { daysFlag: true, accuracy: '2' }
    },
    {
      title: exampleText('exampleUi.decimalDays'),
      description: exampleText(
        'exampleUi.inThisExampleWeConvertFiveDecimalFraction'
      ),
      sampleText: `1 hr
100 hr
9999 hr
12345 hr
333333 hr`,
      sampleResult: `0.0417 days
4.1667 days
416.625 days
514.375 days
13888.875 days`,
      sampleOptions: { daysFlag: true, accuracy: '4' }
    },
    {
      title: exampleText('exampleUi.partialHours'),
      description: exampleText(
        'exampleUi.inTheModernGregorianCalendarACommonYear'
      ),
      sampleText: `0.5
0.01
0.99`,
      sampleResult: `0.02083333
0.00041667
0.04125`,
      sampleOptions: { daysFlag: false, accuracy: '8' }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('time');

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: typeof initialValues, input: string) => {
    setResult(
      convertHoursToDays(input, optionsValues.accuracy, optionsValues.daysFlag)
    );
  };

  const getGroups: GetGroupsType<InitialValuesType> | null = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('inline.dayValueAccuracy'),
      component: (
        <Box>
          <TextFieldWithDesc
            description={inlineText('inline.ifTheCalculatedDaysIsADecimal')}
            value={values.accuracy}
            onOwnChange={(val) => updateField('accuracy', val)}
            type={'text'}
          />
        </Box>
      )
    },
    {
      title: inlineText('inline.daysPostfix'),
      component: (
        <Box>
          <CheckboxWithDesc
            onChange={(val) => updateField('daysFlag', val)}
            checked={values.daysFlag}
            title={inlineText('inline.appendDaysPostfix')}
            description={inlineText(
              'inline.displayNumericDayValuesWithThePostfix'
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
