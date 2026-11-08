import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import { useState } from 'react';
import ToolTextResult from '@components/result/ToolTextResult';
import { GetGroupsType } from '@components/options/ToolOptions';
import { censorText } from './service';
import ToolTextInput from '@components/input/ToolTextInput';
import { InitialValuesType } from './types';
import ToolContent from '@components/ToolContent';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import SelectWithDesc from '@components/options/SelectWithDesc';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';

const initialValues: InitialValuesType = {
  wordsToCensor: '',
  censoredBySymbol: true,
  censorSymbol: '█',
  eachLetter: true,
  censorWord: 'CENSORED'
};

export default function CensorText({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.censorAWordInAQuote'),
      description: exampleText(
        'exampleUi.inThisExampleWeHideTheUnpleasantWord'
      ),
      sampleText:
        'Motivation alone is not enough. If you have an idiot and you motivate him, now you have a motivated idiot. Jim Rohn',
      sampleResult:
        'Motivation alone is not enough. If you have an ☺ and you motivate him, now you have a motivated ☺. Jim Rohn',
      sampleOptions: {
        ...initialValues,
        wordsToCensor: 'idiot',
        censorSymbol: '☺',
        eachLetter: false
      }
    },
    {
      title: exampleText('exampleUi.censorAnExcerpt'),
      description: exampleText(
        'exampleUi.inThisExampleWeCensorMultipleWordsFrom'
      ),
      sampleText:
        '“In the mirrors of the many judgments, my hands are the color of blood. I sometimes fancy myself an evil which exists to oppose other evils; and on that great Day of which the prophets speak but in which they do not truly believe, on the day the world is utterly cleansed of evil, then I too will go down into darkness, swallowing curses. Until then, I will not wash my hands nor let them hang useless.” ― Roger Zelazny, The Guns of Avalon',
      sampleResult:
        '“In the mirrors of the many judgments, my hands are the color of █████. I sometimes fancy myself an ████ which exists to oppose other █████; and on that great Day of which the prophets speak but in which they do not truly believe, on the day the world is utterly cleansed of ████, then I too will go down into ████████, swallowing ██████. Until then, I will not wash my hands nor let them hang useless.” ― Roger Zelazny, The Guns of Avalon',
      sampleOptions: {
        ...initialValues,
        wordsToCensor: 'blood\nevil\ndarkness\ncurses',
        eachLetter: true
      }
    },
    {
      title: exampleText('exampleUi.censorAgentSName'),
      description: exampleText('exampleUi.inThisExampleWeHideTheNameOf'),
      sampleText:
        'My name is John and I am an undercover FBI agent. I usually write my name in lowercase as "john" because I find uppercase letters scary. Unfortunately, in documents, my name is properly capitalized as John and it makes me upset.',
      sampleResult:
        'My name is Agent 007 and I am an undercover FBI agent. I usually write my name in lowercase as "Agent 007" because I find uppercase letters scary. Unfortunately, in documents, my name is properly capitalized as Agent 007 and it makes me upset.',
      sampleOptions: {
        ...initialValues,
        censoredBySymbol: false,
        wordsToCensor: 'john',
        censorWord: 'Agent 007'
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('string');

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  function compute(initialValues: InitialValuesType, input: string) {
    setResult(censorText(input, initialValues));
  }

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('inline.wordsToCensor'),
      component: (
        <Box>
          <TextFieldWithDesc
            multiline
            rows={3}
            value={values.wordsToCensor}
            onOwnChange={(val) => updateField('wordsToCensor', val)}
            description={`Specify all unwanted words that
                 you want to hide in text (separated by a new line)`}
          />
        </Box>
      )
    },
    {
      title: inlineText('inline.censorMode'),
      component: (
        <Box>
          <SelectWithDesc
            selected={values.censoredBySymbol}
            options={[
              { label: inlineText('inline.censorBySymbol'), value: true },
              { label: inlineText('inline.censorByWord'), value: false }
            ]}
            onChange={(value) => updateField('censoredBySymbol', value)}
            description={inlineText('inline.selectTheCensoringMode')}
          />

          {values.censoredBySymbol && (
            <TextFieldWithDesc
              value={values.censorSymbol}
              onOwnChange={(val) => updateField('censorSymbol', val)}
              description={`A symbol, character, or pattern to use for censoring.`}
            />
          )}

          {values.censoredBySymbol && (
            <CheckboxWithDesc
              checked={values.eachLetter}
              onChange={(value) => updateField('eachLetter', value)}
              title={inlineText('inline.maskEachLetter')}
              description={inlineText('inline.putAMaskingSymbolInPlaceOf')}
            />
          )}

          {!values.censoredBySymbol && (
            <TextFieldWithDesc
              value={values.censorWord}
              onOwnChange={(val) => updateField('censorWord', val)}
              description={`Replace all censored words with this word.`}
            />
          )}
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
          title={inlineText('quote.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult
          title={inlineText('inline.censoredText')}
          value={result}
        />
      }
      toolInfo={{ title: `What is a ${title}?`, description: longDescription }}
      exampleCards={exampleCards}
    />
  );
}
