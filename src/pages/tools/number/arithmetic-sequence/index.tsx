import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import ToolTextResult from '@components/result/ToolTextResult';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { generateArithmeticSequence } from './service';
import * as Yup from 'yup';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { useTranslation } from 'react-i18next';

type InitialValuesType = {
  firstTerm: string;
  commonDifference: string;
  numberOfTerms: string;
  separator: string;
};

const initialValues: InitialValuesType = {
  firstTerm: '1',
  commonDifference: '2',
  numberOfTerms: '10',
  separator: ', '
};

export default function ArithmeticSequence({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('number');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.basicArithmeticSequence'),
      description: exampleText(
        'exampleUi.generateASequenceStartingAt1IncreasingBy'
      ),
      sampleOptions: {
        firstTerm: '1',
        commonDifference: '2',
        numberOfTerms: '5',
        separator: ', '
      },
      sampleResult: '1, 3, 5, 7, 9'
    },
    {
      title: exampleText('exampleUi.negativeSequence'),
      description: exampleText(
        'exampleUi.generateADecreasingSequenceStartingAt10'
      ),
      sampleOptions: {
        firstTerm: '10',
        commonDifference: '-3',
        numberOfTerms: '4',
        separator: ' → '
      },
      sampleResult: '10 → 7 → 4 → 1'
    },
    {
      title: exampleText('exampleUi.decimalSequence'),
      description: exampleText('exampleUi.generateASequenceWithDecimalNumbers'),
      sampleOptions: {
        firstTerm: '0.5',
        commonDifference: '0.5',
        numberOfTerms: '6',
        separator: ' '
      },
      sampleResult: '0.5 1 1.5 2 2.5 3'
    }
  ];

  // 校验提示仅做语言接线，规则和数据处理保持不变。
  const { t: inlineText } = useInlineTranslation('number');
  const validationSchema = Yup.object({
    firstTerm: Yup.number().required(inlineText('inline.firstTermIsRequired')),
    commonDifference: Yup.number().required(
      inlineText('inline.commonDifferenceIsRequired')
    ),
    numberOfTerms: Yup.number()
      .min(1, inlineText('inline.mustGenerateAtLeast1Term'))
      .max(1000, inlineText('inline.maximum1000TermsAllowed'))
      .required(inlineText('inline.numberOfTermsIsRequired')),
    separator: Yup.string().required(inlineText('inline.separatorIsRequired'))
  });

  const { t } = useTranslation('number');
  const [result, setResult] = useState<string>('');

  return (
    <ToolContent
      title={title}
      inputComponent={null}
      resultComponent={
        <ToolTextResult
          title={t('arithmeticSequence.resultTitle')}
          value={result}
        />
      }
      initialValues={initialValues}
      validationSchema={validationSchema}
      exampleCards={exampleCards}
      toolInfo={{
        title: t('arithmeticSequence.toolInfo.title'),
        description: t('arithmeticSequence.toolInfo.description')
      }}
      getGroups={({ values, updateField }) => [
        {
          title: t('arithmeticSequence.sequenceParameters'),
          component: (
            <Box>
              <TextFieldWithDesc
                description={t('arithmeticSequence.firstTermDescription')}
                value={values.firstTerm}
                onOwnChange={(val) => updateField('firstTerm', val)}
                type="number"
              />
              <TextFieldWithDesc
                description={t(
                  'arithmeticSequence.commonDifferenceDescription'
                )}
                value={values.commonDifference}
                onOwnChange={(val) => updateField('commonDifference', val)}
                type="number"
              />
              <TextFieldWithDesc
                description={t('arithmeticSequence.numberOfTermsDescription')}
                value={values.numberOfTerms}
                onOwnChange={(val) => updateField('numberOfTerms', val)}
                type="number"
              />
            </Box>
          )
        },
        {
          title: t('arithmeticSequence.outputFormat'),
          component: (
            <TextFieldWithDesc
              description={t('arithmeticSequence.separatorDescription')}
              value={values.separator}
              onOwnChange={(val) => updateField('separator', val)}
            />
          )
        }
      ]}
      compute={(values) => {
        const sequence = generateArithmeticSequence(
          Number(values.firstTerm),
          Number(values.commonDifference),
          Number(values.numberOfTerms),
          values.separator
        );
        setResult(sequence);
      }}
    />
  );
}
