import { useTranslation as useExampleTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { CardExampleType } from '@components/examples/ToolExamples';
import { main } from './service';

const initialValues = {};

type InitialValuesType = typeof initialValues;

export default function CrontabGuru({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('time');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.everyDayAt1635SundayToFriday'),
      description: exampleText('exampleUi.at1635OnEveryDayOfWeek'),
      sampleText: '35 16 * * 0-5',
      sampleResult: 'At 04:35 PM, Sunday through Friday',
      sampleOptions: {}
    },
    {
      title: exampleText('exampleUi.everyMinuteEnglish'),
      description: exampleText('exampleUi.runsEveryMinute'),
      sampleText: '* * * * *',
      sampleResult: 'Every minute',
      sampleOptions: {}
    },
    {
      title: exampleText('exampleUi.every5MinutesEnglish'),
      description: exampleText('exampleUi.runsEvery5Minutes'),
      sampleText: '*/5 * * * *',
      sampleResult: 'Every 5 minutes',
      sampleOptions: {}
    },
    {
      title: exampleText('exampleUi.at1200PmOnThe1stOf'),
      description: exampleText('exampleUi.runsAtNoonOnTheFirstDayOf'),
      sampleText: '0 12 1 * *',
      sampleResult: 'At 12:00 PM, on day 1 of the month',
      sampleOptions: {}
    }
  ];

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (values: InitialValuesType, input: string) => {
    setResult(main(input));
  };

  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={
        <ToolTextInput
          value={input}
          onChange={setInput}
          placeholder="e.g. 35 16 * * 0-5"
        />
      }
      resultComponent={<ToolTextResult value={result} />}
      initialValues={initialValues}
      exampleCards={exampleCards}
      getGroups={null}
      setInput={setInput}
      compute={compute}
      toolInfo={{ title: `What is a ${title}?`, description: longDescription }}
    />
  );
}
