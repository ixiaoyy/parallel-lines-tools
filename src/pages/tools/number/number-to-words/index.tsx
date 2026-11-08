import { useTranslation as useExampleTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { useTranslation } from 'react-i18next';
import { numberToWords } from './service';
import { InitialValuesType } from './types';

const initialValues: InitialValuesType = {
  uppercase: false,
  useAnd: true
};

export default function NumberToWords({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('number');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.spellOutALargeNumber'),
      description: exampleText('exampleUi.thisExampleConverts1234567IntoWords'),
      sampleText: `1234567`,
      sampleResult: `One Million Two Hundred And Thirty Four Thousand Five Hundred And Sixty Seven`,
      sampleOptions: {
        uppercase: false,
        useAnd: true
      }
    },
    {
      title: exampleText('exampleUi.convertDecimalNumbers'),
      description: exampleText(
        'exampleUi.decimalNumbersAreConvertedWithTheFractionalPart'
      ),
      sampleText: `3.14`,
      sampleResult: `Three Point Fourteen`,
      sampleOptions: {
        uppercase: false,
        useAnd: true
      }
    },
    {
      title: exampleText('exampleUi.uppercaseOutputForCheques'),
      description: exampleText(
        'exampleUi.uppercaseOutputIsCommonlyRequiredOnBankCheques'
      ),
      sampleText: `9500`,
      sampleResult: `NINE THOUSAND FIVE HUNDRED`,
      sampleOptions: {
        uppercase: true,
        useAnd: true
      }
    },
    {
      title: exampleText('exampleUi.batchConvertAListOfNumbers'),
      description: exampleText(
        'exampleUi.eachLineIsProcessedIndependentlyPreservingTheLine'
      ),
      sampleText: `42
100
0
-7`,
      sampleResult: `Forty Two
One Hundred
Zero
Minus Seven`,
      sampleOptions: {
        uppercase: false,
        useAnd: true
      }
    }
  ];

  const { t } = useTranslation('number');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: InitialValuesType, input: string) => {
    setResult(numberToWords(input, optionsValues));
  };

  return (
    <ToolContent
      title={title}
      input={input}
      setInput={setInput}
      exampleCards={exampleCards}
      initialValues={initialValues}
      inputComponent={
        <ToolTextInput
          title={t('numberToWords.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult title={t('numberToWords.outputTitle')} value={result} />
      }
      getGroups={({ values, updateField }) => [
        {
          title: t('numberToWords.options.title'),
          component: (
            <React.Fragment>
              <CheckboxWithDesc
                title={t('numberToWords.options.uppercase')}
                description={t('numberToWords.options.uppercaseDescription')}
                checked={values.uppercase}
                onChange={(value) => updateField('uppercase', value)}
              />
              <CheckboxWithDesc
                title={t('numberToWords.options.useAnd')}
                description={t('numberToWords.options.useAndDescription')}
                checked={values.useAnd}
                onChange={(value) => updateField('useAnd', value)}
              />
            </React.Fragment>
          )
        }
      ]}
      compute={compute}
      toolInfo={{
        title: t('numberToWords.toolInfo.title'),
        description: t('numberToWords.toolInfo.description')
      }}
    />
  );
}
