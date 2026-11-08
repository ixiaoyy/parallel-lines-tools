import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import * as Yup from 'yup';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import ToolContent from '@components/ToolContent';
import { GetGroupsType } from '@components/options/ToolOptions';
import { mergeText } from './service';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { useTranslation } from 'react-i18next';

const initialValues = {
  joinCharacter: '',
  deleteBlank: true,
  deleteTrailing: true
};
type InitialValuesType = typeof initialValues;
const validationSchema = Yup.object().shape({
  joinCharacter: Yup.string().required('Join character is required'),
  deleteBlank: Yup.boolean().required('Delete blank is required'),
  deleteTrailing: Yup.boolean().required('Delete trailing is required')
});

export default function JoinText({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.mergeAToDoList'),
      description: exampleText('exampleUi.inThisExampleWeMergeABulletPoint'),
      sampleText: `clean the house

go shopping
feed the cat

make dinner
build a rocket ship and fly away`,
      sampleResult: `clean the house and go shopping and feed the cat and make dinner and build a rocket ship and fly away`,
      sampleOptions: {
        joinCharacter: 'and',
        deleteBlank: true,
        deleteTrailing: true
      }
    },
    {
      title: exampleText('exampleUi.commaSeparatedList'),
      description: exampleText('exampleUi.thisExampleJoinsAColumnOfWordsInto'),
      sampleText: `computer
memory
processor
mouse
keyboard`,
      sampleResult: `computer, memory, processor, mouse, keyboard`,
      sampleOptions: {
        joinCharacter: ',',
        deleteBlank: false,
        deleteTrailing: false
      }
    },
    {
      title: exampleText('exampleUi.verticalWordToHorizontal'),
      description: exampleText(
        'exampleUi.thisExampleRotatesWordsFromAVerticalPosition'
      ),
      sampleText: `T
e
x
t
a
b
u
l
o
u
s
!`,
      sampleResult: `Textabulous!`,
      sampleOptions: {
        joinCharacter: '',
        deleteBlank: false,
        deleteTrailing: false
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('string');

  const mergeOptions = {
    placeholder: inlineText('join.joinCharacterPlaceholder'),
    description: inlineText('join.symbolDescription'),
    accessor: 'joinCharacter' as keyof InitialValuesType
  };
  const blankTrailingOptions: {
    title: string;
    description: string;
    accessor: keyof Omit<InitialValuesType, 'joinCharacter'>;
  }[] = [
    {
      title: inlineText('join.deleteBlankTitle'),
      description: inlineText('inline.deleteLinesThatDonTHaveText'),
      accessor: 'deleteBlank'
    },
    {
      title: inlineText('join.deleteTrailingTitle'),
      description: inlineText('inline.removeSpacesAndTabsAtTheEnd'),
      accessor: 'deleteTrailing'
    }
  ];

  const { t } = useTranslation('string');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const compute = (optionsValues: InitialValuesType, input: any) => {
    const { joinCharacter, deleteBlank, deleteTrailing } = optionsValues;
    setResult(mergeText(input, deleteBlank, deleteTrailing, joinCharacter));
  };

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: t('join.textMergedOptions'),
      component: (
        <TextFieldWithDesc
          placeholder={t('join.joinCharacterPlaceholder')}
          value={values['joinCharacter']}
          onOwnChange={(value) => updateField(mergeOptions.accessor, value)}
          description={t('join.joinCharacterDescription')}
        />
      )
    },
    {
      title: t('join.blankLinesAndTrailingSpaces'),
      component: blankTrailingOptions.map((option) => (
        <CheckboxWithDesc
          key={option.accessor}
          title={t(`join.${option.accessor}Title`)}
          checked={!!values[option.accessor]}
          onChange={(value) => updateField(option.accessor, value)}
          description={t(`join.${option.accessor}Description`)}
        />
      ))
    }
  ];
  return (
    <ToolContent
      title={title}
      initialValues={initialValues}
      compute={compute}
      input={input}
      setInput={setInput}
      inputComponent={
        <ToolTextInput
          title={t('join.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult title={t('join.resultTitle')} value={result} />
      }
      getGroups={getGroups}
      toolInfo={{
        title: t('join.toolInfo.title'),
        description: t('join.toolInfo.description')
      }}
      exampleCards={exampleCards}
    />
  );
}
