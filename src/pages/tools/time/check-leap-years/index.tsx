import { useTranslation as useExampleTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { GetGroupsType } from '@components/options/ToolOptions';
import { CardExampleType } from '@components/examples/ToolExamples';
import { checkLeapYear } from './service';
import { useTranslation } from 'react-i18next';

const initialValues = {};

type InitialValuesType = typeof initialValues;

export default function ConvertDaysToHours({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('time');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('checkLeapYears.exampleTitle'),
      description: exampleText('checkLeapYears.exampleDescription'),
      sampleText: `2025
2026
2027
2028
2029
2030
2031
2032
2033
2034
2035
2036
2037
2038
2039
2040`,
      sampleResult: `2025 is not a leap year.
2026 is not a leap year.
2027 is not a leap year.
2028 is a leap year.
2029 is not a leap year.
2030 is not a leap year.
2031 is not a leap year.
2032 is a leap year.
2033 is not a leap year.
2034 is not a leap year.
2035 is not a leap year.
2036 is a leap year.
2037 is not a leap year.
2038 is not a leap year.
2039 is not a leap year.
2040 is a leap year.`,
      sampleOptions: {}
    }
  ];

  const { t } = useTranslation('time');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: typeof initialValues, input: string) => {
    setResult(checkLeapYear(input));
  };

  const getGroups: GetGroupsType<InitialValuesType> | null = null;

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
        title: t('checkLeapYears.toolInfo.title', { title }),
        description: longDescription
      }}
      exampleCards={exampleCards}
    />
  );
}
