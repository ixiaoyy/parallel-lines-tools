import { useTranslation as useExampleTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState, useRef } from 'react';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import ToolOptions, { GetGroupsType } from '@components/options/ToolOptions';
import { stringReverser } from './service';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import ToolInputAndResult from '@components/ToolInputAndResult';
import ToolExamples, {
  CardExampleType
} from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { FormikProps } from 'formik';
import ToolContent from '@components/ToolContent';
import { useTranslation } from 'react-i18next';

const initialValues = {
  multiLine: true,
  emptyItems: false,
  trim: false
};

export default function Reverse({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<typeof initialValues>[] = [
    {
      title: exampleText('exampleUi.simpleTextReversal'),
      description: exampleText(
        'exampleUi.reversesEachCharacterInTheTextPerfectFor'
      ),
      sampleText: 'Hello World',
      sampleResult: 'dlroW olleH',
      sampleOptions: {
        ...initialValues,
        multiLine: false
      }
    },
    {
      title: exampleText('exampleUi.multiLineReversal'),
      description: exampleText(
        'exampleUi.reversesEachLineIndependentlyWhilePreservingTheLine'
      ),
      sampleText: 'First line\nSecond line\nThird line',
      sampleResult: 'enil tsriF\nenil dnoceS\nenil drihT',
      sampleOptions: {
        ...initialValues,
        multiLine: true
      }
    },
    {
      title: exampleText('exampleUi.cleanReversedText'),
      description: exampleText(
        'exampleUi.trimsWhitespaceAndSkipsEmptyLinesBeforeReversing'
      ),
      sampleText: '  Spaces removed  \n\nEmpty line skipped',
      sampleResult: 'devomer secapS\ndeppiks enil ytpmE',
      sampleOptions: {
        ...initialValues,
        multiLine: true,
        emptyItems: true,
        trim: true
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
    const { multiLine, emptyItems, trim } = optionsValues;
    setResult(stringReverser(input, multiLine, emptyItems, trim));
  };

  const getGroups: GetGroupsType<typeof initialValues> = ({
    values,
    updateField
  }) => [
    {
      title: t('reverse.reversalOptions'),
      component: [
        <CheckboxWithDesc
          key="multiLine"
          checked={values.multiLine}
          title={t('reverse.processMultiLine')}
          description={t('reverse.processMultiLineDescription')}
          onChange={(val) => updateField('multiLine', val)}
        />,
        <CheckboxWithDesc
          key="emptyItems"
          checked={values.emptyItems}
          title={t('reverse.skipEmptyLines')}
          description={t('reverse.skipEmptyLinesDescription')}
          onChange={(val) => updateField('emptyItems', val)}
        />,
        <CheckboxWithDesc
          key="trim"
          checked={values.trim}
          title={t('reverse.trimWhitespace')}
          description={t('reverse.trimWhitespaceDescription')}
          onChange={(val) => updateField('trim', val)}
        />
      ]
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
      inputComponent={
        <ToolTextInput
          title={t('reverse.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult title={t('reverse.resultTitle')} value={result} />
      }
      exampleCards={exampleCards}
    />
  );
}
