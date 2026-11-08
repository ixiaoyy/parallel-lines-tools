import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box, Paper, Typography } from '@mui/material';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import SelectWithDesc from '@components/options/SelectWithDesc';
import {
  calculateTimeBetweenDates,
  formatTimeWithLargestUnit,
  getTimeWithTimezone,
  unitHierarchy
} from './service';
import * as Yup from 'yup';
import { CardExampleType } from '@components/examples/ToolExamples';
import { useTranslation } from 'react-i18next';

type TimeUnit =
  | 'milliseconds'
  | 'seconds'
  | 'minutes'
  | 'hours'
  | 'days'
  | 'months'
  | 'years';

type InitialValuesType = {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  startTimezone: string;
  endTimezone: string;
};

const initialValues: InitialValuesType = {
  startDate: new Date().toISOString().split('T')[0],
  startTime: '00:00',
  endDate: new Date().toISOString().split('T')[0],
  endTime: '12:00',
  startTimezone: 'local',
  endTimezone: 'local'
};

export default function TimeBetweenDates() {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('time');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.oneYearDifference'),
      description: exampleText(
        'exampleUi.calculateTheTimeBetweenDatesThatAreOne'
      ),
      sampleOptions: {
        startDate: '2023-01-01',
        startTime: '12:00',
        endDate: '2024-01-01',
        endTime: '12:00',
        startTimezone: 'local',
        endTimezone: 'local'
      },
      sampleResult: '1 year'
    },
    {
      title: exampleText('exampleUi.differentTimezones'),
      description: exampleText(
        'exampleUi.calculateTheTimeDifferenceBetweenNewYorkAnd'
      ),
      sampleOptions: {
        startDate: '2023-01-01',
        startTime: '12:00',
        endDate: '2023-01-01',
        endTime: '12:00',
        startTimezone: 'GMT-5',
        endTimezone: 'GMT'
      },
      sampleResult: '5 hours'
    },
    {
      title: exampleText('exampleUi.detailedTimeBreakdown'),
      description: exampleText(
        'exampleUi.showADetailedBreakdownOfATimeDifference'
      ),
      sampleOptions: {
        startDate: '2023-01-01',
        startTime: '09:30',
        endDate: '2023-01-03',
        endTime: '14:45',
        startTimezone: 'local',
        endTimezone: 'local'
      },
      sampleResult: '2 days, 5 hours, 15 minutes'
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation(['time', 'translation']);

  const validationSchema = Yup.object({
    startDate: Yup.string().required(inlineText('inline.startDateIsRequired')),
    startTime: Yup.string().required(inlineText('inline.startTimeIsRequired')),
    endDate: Yup.string().required(inlineText('inline.endDateIsRequired')),
    endTime: Yup.string().required(inlineText('inline.endTimeIsRequired')),
    startTimezone: Yup.string(),
    endTimezone: Yup.string()
  });

  const timezoneOptions = [
    { value: 'local', label: inlineText('inline.localTime') },
    ...Array.from(
      new Map(
        Intl.supportedValuesOf('timeZone').map((tz) => {
          const formatter = new Intl.DateTimeFormat('en', {
            timeZone: tz,
            timeZoneName: 'shortOffset'
          });

          const offset =
            formatter
              .formatToParts(new Date())
              .find((part) => part.type === 'timeZoneName')?.value || '';

          const value = offset.replace('UTC', 'GMT');

          return [
            value, // key for Map to ensure uniqueness
            {
              value,
              label: `${value} (${tz})`
            }
          ];
        })
      ).values()
    ).sort((a, b) =>
      a.value.localeCompare(b.value, undefined, { numeric: true })
    )
  ];

  const { t } = useTranslation('time');
  const [result, setResult] = useState<string>('');

  return (
    <ToolContent
      title={t('timeBetweenDates.title')}
      inputComponent={null}
      resultComponent={
        result ? (
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderLeft: '5px solid',
              borderColor: 'primary.main',
              bgcolor: 'background.paper',
              maxWidth: '100%',
              mx: 'auto'
            }}
          >
            <Typography
              variant="h4"
              align="center"
              sx={{ fontWeight: 'bold', color: 'primary.main' }}
            >
              {result}
            </Typography>
          </Paper>
        ) : null
      }
      initialValues={initialValues}
      validationSchema={validationSchema}
      exampleCards={exampleCards}
      toolInfo={{
        title: t('timeBetweenDates.toolInfo.title'),
        description: t('timeBetweenDates.toolInfo.description')
      }}
      getGroups={({ values, updateField }) => [
        {
          title: t('timeBetweenDates.startDateTime'),
          component: (
            <Box>
              <TextFieldWithDesc
                description={t('timeBetweenDates.startDate')}
                value={values.startDate}
                onOwnChange={(val) => updateField('startDate', val)}
                type="date"
              />
              <TextFieldWithDesc
                description={t('timeBetweenDates.startTime')}
                value={values.startTime}
                onOwnChange={(val) => updateField('startTime', val)}
                type="time"
              />
              <SelectWithDesc
                description={t('timeBetweenDates.startTimezone')}
                selected={values.startTimezone}
                onChange={(val: string) => updateField('startTimezone', val)}
                options={timezoneOptions}
              />
            </Box>
          )
        },
        {
          title: t('timeBetweenDates.endDateTime'),
          component: (
            <Box>
              <TextFieldWithDesc
                description={t('timeBetweenDates.endDate')}
                value={values.endDate}
                onOwnChange={(val) => updateField('endDate', val)}
                type="date"
              />
              <TextFieldWithDesc
                description={t('timeBetweenDates.endTime')}
                value={values.endTime}
                onOwnChange={(val) => updateField('endTime', val)}
                type="time"
              />
              <SelectWithDesc
                description={t('timeBetweenDates.endTimezone')}
                selected={values.endTimezone}
                onChange={(val: string) => updateField('endTimezone', val)}
                options={timezoneOptions}
              />
            </Box>
          )
        }
      ]}
      compute={(values) => {
        try {
          const startDateTime = getTimeWithTimezone(
            values.startDate,
            values.startTime,
            values.startTimezone
          );

          const endDateTime = getTimeWithTimezone(
            values.endDate,
            values.endTime,
            values.endTimezone
          );

          // Calculate time difference
          const difference = calculateTimeBetweenDates(
            startDateTime,
            endDateTime
          );

          // Auto-determine the best unit to display based on the time difference
          const bestUnit: TimeUnit =
            unitHierarchy.find((unit) => difference[unit] > 0) ||
            'milliseconds';

          const formattedDifference = formatTimeWithLargestUnit(
            difference,
            bestUnit
          );

          setResult(formattedDifference);
        } catch (error) {
          setResult(
            inlineText('translation:common.error', {
              error: String(
                error instanceof Error
                  ? error.message
                  : inlineText('inline.failedToCalculateTimeDifference')
              )
            })
          );
        }
      }}
    />
  );
}
