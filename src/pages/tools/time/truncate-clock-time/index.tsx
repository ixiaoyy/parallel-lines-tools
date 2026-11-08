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
import SimpleRadio from '@components/options/SimpleRadio';
import { truncateClockTime } from './service';
import { useTranslation } from 'react-i18next';

const initialValues = {
  onlySecond: true,
  zeroPrint: false,
  zeroPadding: true
};
type InitialValuesType = typeof initialValues;

export default function TruncateClockTime({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('time');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.truncateSeconds'),
      description: exampleText('exampleUi.inThisExampleWeGetRidOfThe'),
      sampleText: `01:28:06
07:39:56
02:12:41
10:10:38`,
      sampleResult: `01:28
07:39
02:12
10:10`,
      sampleOptions: { onlySecond: true, zeroPrint: false, zeroPadding: true }
    },
    {
      title: exampleText('truncateClockTime.truncateMinutesAndSeconds'),
      description: exampleText(
        'exampleUi.thisExampleTruncatesFiveClockTimesToAn'
      ),
      sampleText: `04:42:03
07:09:59
11:29:16
21:30:45
13:03:09`,
      sampleResult: `04
07
11
21
13`,
      sampleOptions: { onlySecond: false, zeroPrint: false, zeroPadding: true }
    },
    {
      title: exampleText('exampleUi.setSecondsToZero'),
      description: exampleText('exampleUi.inThisExampleWeSetTheSecondsPart'),
      sampleText: `17:25:55
10:16:07
12:02:09
06:05:11`,
      sampleResult: `17:25:0
10:16:0
12:2:0
6:5:0`,
      sampleOptions: { onlySecond: true, zeroPrint: true, zeroPadding: true }
    }
  ];

  const { t } = useTranslation('time');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: typeof initialValues, input: string) => {
    setResult(
      truncateClockTime(
        input,
        optionsValues.onlySecond,
        optionsValues.zeroPrint,
        optionsValues.zeroPadding
      )
    );
  };

  const getGroups: GetGroupsType<InitialValuesType> | null = ({
    values,
    updateField
  }) => [
    {
      title: t('truncateClockTime.truncationSide'),
      component: (
        <Box>
          <SimpleRadio
            onClick={() => updateField('onlySecond', true)}
            checked={values.onlySecond}
            title={t('truncateClockTime.truncateOnlySeconds')}
            description={t('truncateClockTime.truncateOnlySecondsDescription')}
          />
          <SimpleRadio
            onClick={() => updateField('onlySecond', false)}
            checked={!values.onlySecond}
            title={t('truncateClockTime.truncateMinutesAndSeconds')}
            description={t(
              'truncateClockTime.truncateMinutesAndSecondsDescription'
            )}
          />
        </Box>
      )
    },
    {
      title: t('truncateClockTime.printDroppedComponents'),
      component: (
        <Box>
          <CheckboxWithDesc
            onChange={(val) => updateField('zeroPrint', val)}
            checked={values.zeroPrint}
            title={t('truncateClockTime.zeroPrintTruncatedParts')}
            description={t('truncateClockTime.zeroPrintDescription')}
          />
        </Box>
      )
    },
    {
      title: t('truncateClockTime.timePadding'),
      component: (
        <Box>
          <CheckboxWithDesc
            onChange={(val) => updateField('zeroPadding', val)}
            checked={values.zeroPadding}
            title={t('truncateClockTime.useZeroPadding')}
            description={t('truncateClockTime.zeroPaddingDescription')}
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
        title: t('truncateClockTime.toolInfo.title', { title }),
        description: longDescription
      }}
      exampleCards={exampleCards}
    />
  );
}
