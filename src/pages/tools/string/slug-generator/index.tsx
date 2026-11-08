import { useTranslation as useExampleTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import { GetGroupsType } from '@components/options/ToolOptions';
import { CardExampleType } from '@components/examples/ToolExamples';
import { slugGenerator } from './service';
import { InitialValuesType } from './types';
import { useTranslation } from 'react-i18next';

const initialValues: InitialValuesType = {
  caseSensitive: false
};

export default function SlugGenerator({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.slugLowercase'),
      description: exampleText('exampleUi.convertATitleIntoAUrlFriendlySlug'),
      sampleText: 'Hello World! This is a test.',
      sampleResult: 'hello-world-this-is-a-test',
      sampleOptions: {
        caseSensitive: false
      }
    },
    {
      title: exampleText('exampleUi.slugCasePreserved'),
      description: exampleText('exampleUi.convertATitleIntoAUrlFriendlySlug2'),
      sampleText: 'Hello World! This is a test.',
      sampleResult: 'Hello-World-This-is-a-test',
      sampleOptions: {
        caseSensitive: true
      }
    },
    {
      title: exampleText('exampleUi.slugsMultiLinesProcessing'),
      description: exampleText('exampleUi.convertTitlesOnEachLinesIntoAUrl'),
      sampleText: 'Hello World! This is a test.\nMultiples lines are processed',
      sampleResult: 'Hello-World-This-is-a-test\nMultiples-lines-are-processed',
      sampleOptions: {
        caseSensitive: true
      }
    }
  ];

  const { t } = useTranslation('string');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (values: InitialValuesType, input: string) => {
    setResult(slugGenerator(input, values));
  };

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: t('slugGenerator.options.title'),
      component: [
        <CheckboxWithDesc
          key="case"
          checked={values.caseSensitive}
          title={t('slugGenerator.options.caseLabel')}
          description={t('slugGenerator.options.caseDescription')}
          onChange={(val) => updateField('caseSensitive', val)}
        />
      ]
    }
  ];
  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={
        <ToolTextInput
          value={input}
          onChange={setInput}
          title={t('slugGenerator.inputTitle')}
        />
      }
      resultComponent={
        <ToolTextResult value={result} title={t('slugGenerator.resultTitle')} />
      }
      initialValues={initialValues}
      exampleCards={exampleCards}
      getGroups={getGroups}
      setInput={setInput}
      compute={compute}
      toolInfo={{ title: `What is a ${title}?`, description: longDescription }}
    />
  );
}
