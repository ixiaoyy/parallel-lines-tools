import { useTranslation as useExampleTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import { useState } from 'react';
import ToolTextResult from '@components/result/ToolTextResult';
import { GetGroupsType } from '@components/options/ToolOptions';
import { replaceText } from './service';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import ToolTextInput from '@components/input/ToolTextInput';
import SimpleRadio from '@components/options/SimpleRadio';
import { initialValues, InitialValuesType } from './initialValues';
import ToolContent from '@components/ToolContent';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { useTranslation } from 'react-i18next';

export default function Replacer({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.replaceSpecificWordInText'),
      description: exampleText('exampleUi.inThisExampleWeWillReplaceTheWord'),
      sampleText: 'hello, how are you today? hello!',
      sampleResult: 'hi, how are you today? hi!',
      sampleOptions: {
        textToReplace: 'hello, how are you today? hello!',
        searchValue: 'hello',
        searchRegexp: '',
        replaceValue: 'hi',
        mode: 'text'
      }
    },
    {
      title: exampleText('exampleUi.replaceAllNumbersInText'),
      description: exampleText(
        'exampleUi.inThisExampleWeWillReplaceAllNumbers'
      ),
      sampleText: 'The price is 100$, and the discount is 20%.',
      sampleResult: 'The price is X$, and the discount is X%.',
      sampleOptions: {
        textToReplace: 'The price is 100$, and the discount is 20%.',
        searchValue: '',
        searchRegexp: '/\\d+/g',
        replaceValue: '*',
        mode: 'regexp'
      }
    },
    {
      title: exampleText('exampleUi.replaceAllDatesInText'),
      description: exampleText('exampleUi.inThisExampleWeWillReplaceAllDates'),
      sampleText:
        'The event will take place on 2025-03-10, and the deadline is 2025-03-15.',
      sampleResult:
        'The event will take place on DATE, and the deadline is DATE.',
      sampleOptions: {
        textToReplace:
          'The event will take place on 2025-03-10, and the deadline is 2025-03-15.',
        searchValue: '',
        searchRegexp: '/\\d{4}-\\d{2}-\\d{2}/g',
        replaceValue: 'DATE',
        mode: 'regexp'
      }
    }
  ];

  const { t } = useTranslation('string');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  function compute(optionsValues: InitialValuesType, input: string) {
    setResult(replaceText(optionsValues, input));
  }

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: t('textReplacer.searchText'),
      component: (
        <Box>
          <SimpleRadio
            onClick={() => updateField('mode', 'text')}
            checked={values.mode === 'text'}
            title={t('textReplacer.findPatternInText')}
          />
          <TextFieldWithDesc
            description={t('textReplacer.searchPatternDescription')}
            value={values.searchValue}
            onOwnChange={(val) => updateField('searchValue', val)}
            type={'text'}
          />
          <SimpleRadio
            onClick={() => updateField('mode', 'regexp')}
            checked={values.mode === 'regexp'}
            title={t('textReplacer.findPatternUsingRegexp')}
          />
          <TextFieldWithDesc
            description={t('textReplacer.regexpDescription')}
            value={values.searchRegexp}
            onOwnChange={(val) => updateField('searchRegexp', val)}
            type={'text'}
          />
        </Box>
      )
    },
    {
      title: t('textReplacer.replaceText'),
      component: (
        <Box>
          <TextFieldWithDesc
            description={t('textReplacer.replacePatternDescription')}
            placeholder={t('textReplacer.newTextPlaceholder')}
            value={values.replaceValue}
            onOwnChange={(val) => updateField('replaceValue', val)}
            type={'text'}
          />
        </Box>
      )
    }
  ];

  return (
    <ToolContent
      title={title}
      initialValues={initialValues}
      getGroups={getGroups}
      compute={compute}
      input={input}
      setInput={setInput}
      inputComponent={
        <ToolTextInput
          title={t('textReplacer.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult title={t('textReplacer.resultTitle')} value={result} />
      }
      toolInfo={{
        title: t('textReplacer.toolInfo.title'),
        description: t('textReplacer.toolInfo.description')
      }}
      exampleCards={exampleCards}
    />
  );
}
