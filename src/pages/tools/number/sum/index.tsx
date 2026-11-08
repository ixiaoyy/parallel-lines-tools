import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { GetGroupsType } from '@components/options/ToolOptions';
import { compute, NumberExtractionType } from './service';
import RadioWithTextField from '@components/options/RadioWithTextField';
import SimpleRadio from '@components/options/SimpleRadio';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import ToolContent from '@components/ToolContent';
import { useTranslation } from 'react-i18next';

const initialValues = {
  extractionType: 'smart' as NumberExtractionType,
  separator: '\\n',
  printRunningSum: false
};
type InitialValuesType = typeof initialValues;

export default function SumNumbers({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('number');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('sum.example1Title'),
      description: exampleText('sum.example1Description'),
      sampleText: `0
1
20
33
400
505
660
777
8008
9090`,
      sampleResult: `19494`,
      sampleOptions: {
        extractionType: 'delimiter',
        separator: '\\n',
        printRunningSum: false
      }
    },
    {
      title: exampleText('sum.example2Title'),
      description: exampleText(
        'exampleUi.thisExampleReversesAColumnOfTwentyThree'
      ),
      sampleText: `This year gardeners have planted 20 red maples, 35 sweetgum, 13 quaking aspen, and 7 white oaks in the central park of the city.`,
      sampleResult: `75`,
      sampleOptions: {
        extractionType: 'smart',
        separator: '\\n',
        printRunningSum: false
      }
    },
    {
      title: exampleText('sum.example3Title'),
      description: exampleText('sum.example3Description'),
      sampleText: `1, 2, 3, 4, 5, 6, 7, 8, 9, -1.1, -2.1, -3.1, -4.1, -5.1, -6.1, -7.1, -8.1, -9.1, 10, 20, 30, 40, 50, 60, 70, 80, 90, -10.2, -20.2, -30.2, -40.2, -50.2, -60.2, -70.2, -80.2, -90.2, 100, 200, 300, 400, 500, 600, 700, 800, 900, -100.3, -200.3, -300.3, -400.3, -500.3, -600.3, -700.3, -800.3, -900.3, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, -1000.4, -2000.4, -3000.4, -4000.4, -5000.4, -6000.4, -7000.4, -8000.4, -9000.4, 10001, 20001, 30001, 40001, 50001, 60001, 70001, 80001, 90001, -10000, -20000, -30000, -40000, -50000, -60000, -70000, -80000, -90000`,
      sampleResult: `0`,
      sampleOptions: {
        extractionType: 'delimiter',
        separator: ', ',
        printRunningSum: false
      }
    },
    {
      title: exampleText('sum.example4Title'),
      description: exampleText('sum.example4Description'),
      sampleText: `0
1
2
3
4
5
6
7
8
9`,
      sampleResult: `0
1
3
6
10
15
21
28
36
45`,
      sampleOptions: {
        extractionType: 'delimiter',
        separator: '\\n',
        printRunningSum: true
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('number');
  const extractionTypes: {
    title: string;
    description: string;
    type: NumberExtractionType;
    withTextField: boolean;
    textValueAccessor?: keyof typeof initialValues;
  }[] = [
    {
      title: inlineText('sum.extractionTypes.smart.title'),
      description: inlineText('sum.extractionTypes.smart.description'),
      type: 'smart',
      withTextField: false
    },
    {
      title: inlineText('sum.extractionTypes.delimiter.title'),
      type: 'delimiter',
      description: inlineText(
        'inline.inputSeparatorcustomizeTheNumberSeparatorHereBy'
      ),
      withTextField: true,
      textValueAccessor: 'separator'
    }
  ];

  const { t } = useTranslation('number');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: t('sum.numberExtraction'),
      component: extractionTypes.map(
        ({ title, type, withTextField, textValueAccessor }) =>
          withTextField ? (
            <RadioWithTextField
              key={type}
              checked={type === values.extractionType}
              title={t(`sum.extractionTypes.${type}.title`)}
              fieldName={'extractionType'}
              description={t(`sum.extractionTypes.${type}.description`)}
              value={
                textValueAccessor ? values[textValueAccessor].toString() : ''
              }
              onRadioClick={() => updateField('extractionType', type)}
              onTextChange={(val) =>
                textValueAccessor ? updateField(textValueAccessor, val) : null
              }
            />
          ) : (
            <SimpleRadio
              key={title}
              onClick={() => updateField('extractionType', type)}
              checked={values.extractionType === type}
              description={t(`sum.extractionTypes.${type}.description`)}
              title={t(`sum.extractionTypes.${type}.title`)}
            />
          )
      )
    },
    {
      title: t('sum.runningSum'),
      component: (
        <CheckboxWithDesc
          title={t('sum.printRunningSum')}
          description={t('sum.printRunningSumDescription')}
          checked={values.printRunningSum}
          onChange={(value) => updateField('printRunningSum', value)}
        />
      )
    }
  ];
  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={
        <ToolTextInput
          title={t('sum.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult title={t('sum.resultTitle')} value={result} />
      }
      initialValues={initialValues}
      getGroups={getGroups}
      compute={(optionsValues, input) => {
        const { extractionType, printRunningSum, separator } = optionsValues;
        setResult(compute(input, extractionType, printRunningSum, separator));
      }}
      setInput={setInput}
      toolInfo={{
        title: t('sum.toolInfo.title'),
        description: t('sum.toolInfo.description')
      }}
      exampleCards={exampleCards}
    />
  );
}
