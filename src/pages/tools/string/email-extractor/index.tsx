import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { GetGroupsType } from '@components/options/ToolOptions';
import { extractEmails } from './service';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import ToolContent from '@components/ToolContent';
import { useTranslation } from 'react-i18next';

const initialValues = {
  unique: true
};

export default function EmailExtractor({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<typeof initialValues>[] = [
    {
      title: exampleText('exampleUi.extractEmailsFromText'),
      description: exampleText(
        'exampleUi.extractAllEmailAddressesFromABlockOf'
      ),
      sampleText:
        'Contact us at support@example.com or sales@example.org for more info. You can also reach john.doe@company.co.uk.',
      sampleResult:
        'support@example.com\nsales@example.org\njohn.doe@company.co.uk',
      sampleOptions: { ...initialValues }
    },
    {
      title: exampleText('exampleUi.duplicateRemoval'),
      description: exampleText(
        'exampleUi.whenUniqueResultsOnlyIsEnabledDuplicateEmails'
      ),
      sampleText: 'admin@test.com, admin@test.com, user@test.com',
      sampleResult: 'admin@test.com\nuser@test.com',
      sampleOptions: { ...initialValues }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('string');

  const { t } = useTranslation('string');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const computeExternal = (
    optionsValues: typeof initialValues,
    input: string
  ) => {
    const { unique } = optionsValues;
    setResult(extractEmails(input, unique));
  };

  const getGroups: GetGroupsType<typeof initialValues> = ({
    values,
    updateField
  }) => [
    {
      title: t('emailExtractor.options.title'),
      component: [
        <CheckboxWithDesc
          key="unique"
          checked={values.unique}
          title={t('emailExtractor.options.uniqueTitle')}
          description={t('emailExtractor.options.uniqueDesc')}
          onChange={(val) => updateField('unique', val)}
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
          title={inlineText('quote.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult
          title={inlineText('inline.extractedEmails')}
          value={result}
        />
      }
      exampleCards={exampleCards}
    />
  );
}
