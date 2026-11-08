import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { GetGroupsType } from '@components/options/ToolOptions';
import { createPalindromeList } from './service';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import ToolContent from '@components/ToolContent';

const initialValues = {
  lastChar: true,
  multiLine: false
};

export default function CreatePalindrome({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<typeof initialValues>[] = [
    {
      title: exampleText('exampleUi.createSimplePalindrome'),
      description: exampleText(
        'exampleUi.createsAPalindromeByRepeatingTheTextIn'
      ),
      sampleText: 'level',
      sampleResult: 'levellevel',
      sampleOptions: {
        ...initialValues,
        lastChar: true
      }
    },
    {
      title: exampleText(
        'exampleUi.createPalindromeWithoutLastCharacterDuplication'
      ),
      description: exampleText(
        'exampleUi.createsAPalindromeWithoutRepeatingTheLastCharacter'
      ),
      sampleText: 'radar',
      sampleResult: 'radarada',
      sampleOptions: {
        ...initialValues,
        lastChar: false
      }
    },
    {
      title: exampleText('exampleUi.multiLinePalindromeCreation'),
      description: exampleText(
        'exampleUi.createsPalindromesForEachLineIndependently'
      ),
      sampleText: 'mom\ndad\nwow',
      sampleResult: 'mommom\ndaddad\nwowwow',
      sampleOptions: {
        ...initialValues,
        lastChar: true,
        multiLine: true
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('string');

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const computeExternal = (
    optionsValues: typeof initialValues,
    input: string
  ) => {
    const { lastChar, multiLine } = optionsValues;
    setResult(createPalindromeList(input, lastChar, multiLine));
  };

  const getGroups: GetGroupsType<typeof initialValues> = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('inline.palindromeOptions'),
      component: [
        <CheckboxWithDesc
          key="lastChar"
          checked={values.lastChar}
          title={inlineText('inline.includeLastCharacter')}
          description={inlineText('inline.repeatTheLastCharacterInTheReversed')}
          onChange={(val) => updateField('lastChar', val)}
        />,
        <CheckboxWithDesc
          key="multiLine"
          checked={values.multiLine}
          title={inlineText('reverse.processMultiLine')}
          description={inlineText(
            'inline.createPalindromesForEachLineIndependently'
          )}
          onChange={(val) => updateField('multiLine', val)}
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
          title={inlineText('inline.palindromeText')}
          value={result}
        />
      }
      toolInfo={{
        title: inlineText('inline.whatIsAStringPalindromeCreator'),
        description: longDescription
      }}
      exampleCards={exampleCards}
    />
  );
}
