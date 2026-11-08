import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState, useRef } from 'react';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import ToolOptions, { GetGroupsType } from '@components/options/ToolOptions';
import { palindromeList, SplitOperatorType } from './service';
import RadioWithTextField from '@components/options/RadioWithTextField';
import ToolInputAndResult from '@components/ToolInputAndResult';
import ToolExamples, {
  CardExampleType
} from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { FormikProps } from 'formik';
import ToolContent from '@components/ToolContent';

const initialValues = {
  splitOperatorType: 'symbol' as SplitOperatorType,
  symbolValue: ' ',
  regexValue: '\\s+'
};

export default function Palindrome({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<typeof initialValues>[] = [
    {
      title: exampleText('exampleUi.checkForWordPalindromes'),
      description: exampleText('exampleUi.checksIfEachWordInTheTextIs'),
      sampleText: 'radar level hello anna',
      sampleResult: 'true true false true',
      sampleOptions: {
        ...initialValues,
        symbolValue: ' '
      }
    },
    {
      title: exampleText('exampleUi.checkCsvWords'),
      description: exampleText(
        'exampleUi.checksPalindromeStatusForCommaSeparatedWords'
      ),
      sampleText: 'mom,dad,wow,test',
      sampleResult: 'true true true false',
      sampleOptions: {
        ...initialValues,
        symbolValue: ','
      }
    },
    {
      title: exampleText('exampleUi.checkWithRegularExpression'),
      description: exampleText('exampleUi.useARegularExpressionToSplitTextAnd'),
      sampleText: 'level:madam;noon|test',
      sampleResult: 'true true true false',
      sampleOptions: {
        ...initialValues,
        splitOperatorType: 'regex',
        regexValue: '[:|;]|\\|'
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('string');
  const splitOperators: {
    title: string;
    description: string;
    type: SplitOperatorType;
  }[] = [
    {
      title: inlineText('split.symbolTitle'),
      description: inlineText('inline.characterThatWillBeUsedToSplit'),
      type: 'symbol'
    },
    {
      title: inlineText('split.regexTitle'),
      type: 'regex',
      description: inlineText('inline.regularExpressionThatWillBeUsedTo')
    }
  ];

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const computeExternal = (
    optionsValues: typeof initialValues,
    input: string
  ) => {
    const { splitOperatorType, symbolValue, regexValue } = optionsValues;
    const separator = splitOperatorType === 'symbol' ? symbolValue : regexValue;
    setResult(palindromeList(splitOperatorType, input, separator));
  };

  const getGroups: GetGroupsType<typeof initialValues> = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('inline.splittingOptions'),
      component: splitOperators.map(({ title, description, type }) => (
        <RadioWithTextField
          key={type}
          checked={type === values.splitOperatorType}
          title={title}
          fieldName={'splitOperatorType'}
          description={description}
          value={values[`${type}Value`]}
          onRadioClick={() => updateField('splitOperatorType', type)}
          onTextChange={(val) => updateField(`${type}Value`, val)}
        />
      ))
    }
  ];

  return (
    <ToolContent
      title={title}
      initialValues={initialValues}
      getGroups={getGroups}
      compute={computeExternal}
      input={input}
      setInput={setInput}
      inputComponent={<ToolTextInput value={input} onChange={setInput} />}
      resultComponent={
        <ToolTextResult
          title={inlineText('inline.palindromeResults')}
          value={result}
        />
      }
      exampleCards={exampleCards}
    />
  );
}
