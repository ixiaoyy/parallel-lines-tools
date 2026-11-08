import { useTranslation as useExampleTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { GetGroupsType } from '@components/options/ToolOptions';
import { CardExampleType } from '@components/examples/ToolExamples';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import { convertDaysToHours } from './service';
import { useTranslation } from 'react-i18next';

const initialValues = {
  hoursFlag: false
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
      title: exampleText('exampleUi.fullDaysToHours'),
      description: exampleText(
        'exampleUi.thisExampleCalculatesHowManyHoursThereAre'
      ),
      sampleText: `1 day
7 days
30 days
90 days
125 days
500 days`,
      sampleResult: `24 hours
168 hours
720 hours
2160 hours
3000 hours
12000 hours`,
      sampleOptions: { hoursFlag: true }
    },
    {
      title: exampleText('exampleUi.fractionalDaysToHours'),
      description: exampleText(
        'exampleUi.inThisExampleWeConvertFiveDecimalFraction'
      ),
      sampleText: `0.2 d
1.5 days
25.25
9.999
350.401`,
      sampleResult: `4.8
36
606
239.976
8409.624`,
      sampleOptions: { hoursFlag: false }
    },
    {
      title: exampleText('exampleUi.numberOfHoursInAYear'),
      description: exampleText(
        'exampleUi.inTheModernGregorianCalendarACommonYear'
      ),
      sampleText: `365.242199 days`,
      sampleResult: `8765.812776 hours`,
      sampleOptions: { hoursFlag: true }
    }
  ];

  const { t } = useTranslation('time');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: typeof initialValues, input: string) => {
    setResult(convertDaysToHours(input, optionsValues.hoursFlag));
  };

  const getGroups: GetGroupsType<InitialValuesType> | null = ({
    values,
    updateField
  }) => [
    {
      title: t('convertDaysToHours.hoursName'),
      component: (
        <Box>
          <CheckboxWithDesc
            onChange={(val) => updateField('hoursFlag', val)}
            checked={values.hoursFlag}
            title={t('convertDaysToHours.addHoursName')}
            description={t('convertDaysToHours.addHoursNameDescription')}
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
      toolInfo={{
        title: t('convertDaysToHours.toolInfo.title'),
        description: t('convertDaysToHours.toolInfo.description')
      }}
      exampleCards={exampleCards}
    />
  );
}
