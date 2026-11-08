import { useTranslation as useExampleTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { GetGroupsType } from '@components/options/ToolOptions';
import { CardExampleType } from '@components/examples/ToolExamples';
import SelectWithDesc from '@components/options/SelectWithDesc';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import { DiscordTimestampGenerator } from './service';
import { useTranslation } from 'react-i18next';
import { DiscordTimestampFormat, InitialValuesType } from './types';

const initialValues: InitialValuesType = {
  format: 'F',
  enforceUTC: true
};

type formatProps = {
  label: string;
  value: DiscordTimestampFormat;
};

export default function TruncateClockTime({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('time');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.convertASingleDatetime'),
      description: exampleText(
        'exampleUi.inThisExampleWeConvertASingleDatetime'
      ),
      sampleText: `2025-03-15T10:00:00`,
      sampleResult: `<t:1742032800:F>`,
      sampleOptions: {
        ...initialValues,
        format: 'F'
      }
    },
    {
      title: exampleText('exampleUi.convertMultipleDatetimes'),
      description: exampleText(
        'exampleUi.inThisExampleWeConvertMultipleDatetimesAt'
      ),
      sampleText: `2025-03-15T10:00:00
2025-07-20T18:45:00

2025-11-05T08:15:00`,
      sampleResult: `<t:1742032800:f>
<t:1753037100:f>

<t:1762330500:f>`,
      sampleOptions: {
        ...initialValues,
        format: 'f'
      }
    },
    {
      title: exampleText('exampleUi.relativeTimestamps'),
      description: exampleText('exampleUi.inThisExampleWeUseTheRelativeFormat'),
      sampleText: `2025-03-15T10:00:00
2025-07-20T18:45:00
2025-11-05T08:15:00`,
      sampleResult: `<t:1742032800:R>
<t:1753037100:R>
<t:1762330500:R>`,
      sampleOptions: {
        ...initialValues,
        format: 'R'
      }
    }
  ];

  const { t } = useTranslation('time');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: InitialValuesType, input: string) => {
    setResult(DiscordTimestampGenerator(input, optionsValues));
  };

  const FORMATS: formatProps[] = [
    { label: t('discordTimestamp.formats.short_time'), value: 't' },
    { label: t('discordTimestamp.formats.long_time'), value: 'T' },
    { label: t('discordTimestamp.formats.short_date'), value: 'd' },
    { label: t('discordTimestamp.formats.long_date'), value: 'D' },
    { label: t('discordTimestamp.formats.short_datetime'), value: 'f' },
    { label: t('discordTimestamp.formats.long_datetime'), value: 'F' },
    { label: t('discordTimestamp.formats.relative'), value: 'R' }
  ];

  const getGroups: GetGroupsType<InitialValuesType> | null = ({
    values,
    updateField
  }) => [
    {
      title: t('discordTimestamp.utc.title'),
      component: (
        <Box>
          <CheckboxWithDesc
            checked={values.enforceUTC}
            onChange={(value) => updateField('enforceUTC', value)}
            title={t('discordTimestamp.utc.label')}
            description={t('discordTimestamp.utc.description')}
          />
        </Box>
      )
    },
    {
      title: t('discordTimestamp.formats.title'),
      component: (
        <Box>
          <SelectWithDesc
            selected={values.format}
            onChange={(value) => updateField('format', value)}
            options={FORMATS.map((format) => ({
              label: format.label,
              value: format.value
            }))}
            description={t('discordTimestamp.formats.description')}
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
          value={input}
          title={t('discordTimestamp.inputTitle')}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult
          title={t('discordTimestamp.outputTitle')}
          value={result}
        />
      }
      initialValues={initialValues}
      getGroups={getGroups}
      setInput={setInput}
      compute={compute}
      toolInfo={{
        title: title,
        description: longDescription
      }}
      exampleCards={exampleCards}
    />
  );
}
