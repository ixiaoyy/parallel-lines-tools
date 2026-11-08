import { useTranslation as useExampleTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useRef, useState } from 'react';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { compute, SplitOperatorType } from './service';
import RadioWithTextField from '@components/options/RadioWithTextField';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import ToolExamples, {
  CardExampleType
} from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { FormikProps } from 'formik';
import ToolContent from '@components/ToolContent';
import { useTranslation } from 'react-i18next';
import { ParseKeys } from 'i18next';

const initialValues = {
  splitSeparatorType: 'symbol' as SplitOperatorType,
  symbolValue: ' ',
  regexValue: '/\\s+/',
  lengthValue: '16',
  chunksValue: '4',

  outputSeparator: '\\n',
  charBeforeChunk: '',
  charAfterChunk: ''
};
const splitOperators: {
  title: ParseKeys<'string'>;
  description: ParseKeys<'string'>;
  type: SplitOperatorType;
}[] = [
  {
    title: 'split.symbolTitle',
    description: 'split.symbolDescription',
    type: 'symbol'
  },
  {
    title: 'split.regexTitle',
    type: 'regex',
    description: 'split.regexDescription'
  },
  {
    title: 'split.lengthTitle',
    description: 'split.lengthDescription',
    type: 'length'
  },
  {
    title: 'split.chunksTitle',
    description: 'split.chunksDescription',
    type: 'chunks'
  }
];
const outputOptions: {
  description: ParseKeys<'string'>;
  accessor: keyof typeof initialValues;
}[] = [
  {
    description: 'split.outputSeparatorDescription',
    accessor: 'outputSeparator'
  },
  {
    description: 'split.charBeforeChunkDescription',
    accessor: 'charBeforeChunk'
  },
  {
    description: 'split.charAfterChunkDescription',
    accessor: 'charAfterChunk'
  }
];

export default function SplitText({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<typeof initialValues>[] = [
    {
      title: exampleText('exampleUi.splitGermanNumbers'),
      description: exampleText('exampleUi.inThisExampleWeBreakTheTextInto'),
      sampleText: `1 - eins, 2 - zwei, 3 - drei, 4 - vier, 5 - fünf, 6 - sechs, 7 - sieben, 8 - acht, 9 - neun, 10 - zehn`,
      sampleResult: `1 - eins
2 - zwei
3 - drei
4 - vier
5 - fünf
6 - sechs
7 - sieben
8 - acht
9 - neun
10 - zehn`,
      sampleOptions: {
        ...initialValues,
        symbolValue: ',',
        splitSeparatorType: 'symbol',
        outputSeparator: '\n'
      }
    },
    {
      title: exampleText('exampleUi.textCleanupViaARegularExpression'),
      description: exampleText('exampleUi.inThisExampleWeUseASuperSmart'),
      sampleText: `Finding%№1.65*;?words()is'12#easy_`,
      sampleResult: `Finding
words
is
easy`,
      sampleOptions: {
        ...initialValues,
        regexValue: '[^a-zA-Z]+',
        splitSeparatorType: 'regex',
        outputSeparator: '\n'
      }
    },
    {
      title: exampleText('exampleUi.threeDotOutputSeparator'),
      description: exampleText('exampleUi.thisExampleSplitsTheTextBySpacesAnd'),
      sampleText: `If you started with $0.01 and doubled your money every day, it would take 27 days to become a millionaire.`,
      sampleResult: `If...you...started...with...$0.01...and...doubled...your...money...every...day,...it...would...take...27...days...to...become...a...millionaire.!`,
      sampleOptions: {
        ...initialValues,
        symbolValue: '',
        splitSeparatorType: 'symbol',
        outputSeparator: '...'
      }
    }
  ];

  const { t } = useTranslation('string');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const computeExternal = (
    optionsValues: typeof initialValues,
    input: string
  ) => {
    const {
      splitSeparatorType,
      outputSeparator,
      charBeforeChunk,
      charAfterChunk,
      chunksValue,
      symbolValue,
      regexValue,
      lengthValue
    } = optionsValues;

    setResult(
      compute(
        splitSeparatorType,
        input,
        symbolValue,
        regexValue,
        Number(lengthValue),
        Number(chunksValue),
        charBeforeChunk,
        charAfterChunk,
        outputSeparator
      )
    );
  };

  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={<ToolTextInput value={input} onChange={setInput} />}
      resultComponent={
        <ToolTextResult title={t('split.resultTitle')} value={result} />
      }
      initialValues={initialValues}
      getGroups={({ values, updateField }) => [
        {
          title: t('split.splitSeparatorOptions'),
          component: splitOperators.map(({ title, description, type }) => (
            <RadioWithTextField
              key={type}
              checked={type === values.splitSeparatorType}
              title={t(title)}
              fieldName={'splitSeparatorType'}
              description={t(description)}
              value={values[`${type}Value`]}
              onRadioClick={() => updateField('splitSeparatorType', type)}
              onTextChange={(val) => updateField(`${type}Value`, val)}
            />
          ))
        },
        {
          title: t('split.outputSeparatorOptions'),
          component: outputOptions.map((option) => (
            <TextFieldWithDesc
              key={option.accessor}
              value={values[option.accessor]}
              onOwnChange={(value) => updateField(option.accessor, value)}
              description={t(option.description)}
            />
          ))
        }
      ]}
      compute={computeExternal}
      setInput={setInput}
      exampleCards={exampleCards}
    />
  );
}
