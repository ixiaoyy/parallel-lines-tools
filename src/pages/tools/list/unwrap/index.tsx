import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Box } from '@mui/material';
import ToolContent from '@components/ToolContent';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { SplitOperatorType, unwrapList } from './service';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { GetGroupsType } from '@components/options/ToolOptions';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import SimpleRadio from '@components/options/SimpleRadio';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import * as Yup from 'yup';

interface InitialValuesType {
  splitOperatorType: SplitOperatorType;
  splitSeparator: string;
  joinSeparator: string;
  deleteEmptyItems: boolean;
  multiLevel: boolean;
  trimItems: boolean;
  left: string;
  right: string;
}

const initialValues: InitialValuesType = {
  splitOperatorType: 'symbol',
  splitSeparator: '\n',
  joinSeparator: '\n',
  deleteEmptyItems: true,
  multiLevel: true,
  trimItems: true,
  left: '',
  right: ''
};

export default function Unwrap({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('list');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.unwrapQuotesFromListItems'),
      description: exampleText(
        'exampleUi.thisExampleShowsHowToRemoveQuotesFrom'
      ),
      sampleText: '"apple"\n"banana"\n"orange"',
      sampleResult: 'apple\nbanana\norange',
      sampleOptions: {
        splitOperatorType: 'symbol',
        splitSeparator: '\n',
        joinSeparator: '\n',
        deleteEmptyItems: true,
        multiLevel: true,
        trimItems: true,
        left: '"',
        right: '"'
      }
    },
    {
      title: exampleText('exampleUi.unwrapMultipleLevelsOfCharacters'),
      description: exampleText(
        'exampleUi.thisExampleShowsHowToRemoveMultipleLevels'
      ),
      sampleText: '###Hello###\n##World##\n#Test#',
      sampleResult: 'Hello\nWorld\nTest',
      sampleOptions: {
        splitOperatorType: 'symbol',
        splitSeparator: '\n',
        joinSeparator: '\n',
        deleteEmptyItems: true,
        multiLevel: true,
        trimItems: true,
        left: '#',
        right: '#'
      }
    },
    {
      title: exampleText('exampleUi.unwrapAndJoinWithCustomSeparator'),
      description: exampleText('exampleUi.thisExampleShowsHowToUnwrapItemsAnd'),
      sampleText: '[item1]\n[item2]\n[item3]',
      sampleResult: 'item1, item2, item3',
      sampleOptions: {
        splitOperatorType: 'symbol',
        splitSeparator: '\n',
        joinSeparator: ', ',
        deleteEmptyItems: true,
        multiLevel: false,
        trimItems: true,
        left: '[',
        right: ']'
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation(['list', 'translation']);

  const validationSchema = Yup.object({
    splitSeparator: Yup.string().required(
      inlineText('inline.theSeparatorIsRequired')
    ),
    joinSeparator: Yup.string().required(
      inlineText('inline.theJoinSeparatorIsRequired')
    )
  });

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: InitialValuesType, input: string) => {
    if (input) {
      try {
        setResult(
          unwrapList(
            optionsValues.splitOperatorType,
            input,
            optionsValues.splitSeparator,
            optionsValues.joinSeparator,
            optionsValues.deleteEmptyItems,
            optionsValues.multiLevel,
            optionsValues.trimItems,
            optionsValues.left,
            optionsValues.right
          )
        );
      } catch (error) {
        if (error instanceof Error) {
          setResult(
            inlineText('translation:common.error', {
              error: String(error.message)
            })
          );
        } else {
          setResult(inlineText('inline.anUnknownErrorOccurred'));
        }
      }
    }
  };

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('duplicate.splitOptions'),
      component: (
        <Box>
          <SimpleRadio
            onClick={() => updateField('splitOperatorType', 'symbol')}
            checked={values.splitOperatorType === 'symbol'}
            title={inlineText('duplicate.splitBySymbol')}
          />
          <SimpleRadio
            onClick={() => updateField('splitOperatorType', 'regex')}
            checked={values.splitOperatorType === 'regex'}
            title={inlineText('duplicate.splitByRegex')}
          />
          <TextFieldWithDesc
            value={values.splitSeparator}
            onOwnChange={(val) => updateField('splitSeparator', val)}
            description={inlineText('duplicate.splitSeparatorDescription')}
          />
          <TextFieldWithDesc
            value={values.joinSeparator}
            onOwnChange={(val) => updateField('joinSeparator', val)}
            description={inlineText('inline.separatorToJoinTheUnwrappedList')}
          />
        </Box>
      )
    },
    {
      title: inlineText('inline.unwrapOptions'),
      component: (
        <Box>
          <TextFieldWithDesc
            value={values.left}
            onOwnChange={(val) => updateField('left', val)}
            description={inlineText('inline.charactersToRemoveFromTheLeftSide')}
          />
          <TextFieldWithDesc
            value={values.right}
            onOwnChange={(val) => updateField('right', val)}
            description={inlineText(
              'inline.charactersToRemoveFromTheRightSide'
            )}
          />
          <CheckboxWithDesc
            checked={values.multiLevel}
            onChange={(checked) => updateField('multiLevel', checked)}
            title={inlineText('inline.removeMultipleLevelsOfWrapping')}
          />
          <CheckboxWithDesc
            checked={values.trimItems}
            onChange={(checked) => updateField('trimItems', checked)}
            title={inlineText('inline.trimWhitespaceFromItems')}
          />
          <CheckboxWithDesc
            checked={values.deleteEmptyItems}
            onChange={(checked) => updateField('deleteEmptyItems', checked)}
            title={inlineText('findMostPopular.removeEmptyItems')}
          />
        </Box>
      )
    }
  ];

  return (
    <ToolContent
      title={title}
      inputComponent={
        <ToolTextInput
          title={inlineText('chunk.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult
          title={inlineText('inline.unwrappedList')}
          value={result}
        />
      }
      initialValues={initialValues}
      getGroups={getGroups}
      validationSchema={validationSchema}
      toolInfo={{
        title: inlineText('inline.listUnwrapping'),
        description: inlineText('inline.thisToolAllowsYouToRemoveWrapping')
      }}
      exampleCards={exampleCards}
      input={input}
      setInput={setInput}
      compute={compute}
    />
  );
}
