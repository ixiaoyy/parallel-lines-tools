import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Box } from '@mui/material';
import ToolContent from '@components/ToolContent';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { SplitOperatorType, truncateList } from './service';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { GetGroupsType } from '@components/options/ToolOptions';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import SimpleRadio from '@components/options/SimpleRadio';
import * as Yup from 'yup';

interface InitialValuesType {
  splitOperatorType: SplitOperatorType;
  splitSeparator: string;
  joinSeparator: string;
  end: boolean;
  length: string;
}

const initialValues: InitialValuesType = {
  splitOperatorType: 'symbol',
  splitSeparator: ',',
  joinSeparator: ',',
  end: true,
  length: '3'
};

export default function Truncate({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('list');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.keepFirst3ItemsInAList'),
      description: exampleText('exampleUi.thisExampleShowsHowToKeepOnlyThe'),
      sampleText: 'apple, pineapple, lemon, orange, mango',
      sampleResult: 'apple,pineapple,lemon',
      sampleOptions: {
        splitOperatorType: 'symbol',
        splitSeparator: ', ',
        joinSeparator: ',',
        end: true,
        length: '3'
      }
    },
    {
      title: exampleText('exampleUi.keepLast2ItemsInAList'),
      description: exampleText('exampleUi.thisExampleShowsHowToKeepOnlyThe2'),
      sampleText: 'apple, pineapple, lemon, orange, mango',
      sampleResult: 'orange,mango',
      sampleOptions: {
        splitOperatorType: 'symbol',
        splitSeparator: ', ',
        joinSeparator: ',',
        end: false,
        length: '2'
      }
    },
    {
      title: exampleText('exampleUi.truncateAListWithCustomSeparators'),
      description: exampleText('exampleUi.thisExampleShowsHowToTruncateAList'),
      sampleText: 'apple | pineapple | lemon | orange | mango',
      sampleResult: 'apple - pineapple - lemon',
      sampleOptions: {
        splitOperatorType: 'symbol',
        splitSeparator: ' | ',
        joinSeparator: ' - ',
        end: true,
        length: '3'
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
    ),
    length: Yup.number()
      .typeError(inlineText('inline.lengthMustBeANumber'))
      .min(0, inlineText('inline.lengthMustBeAPositiveNumber'))
      .required(inlineText('inline.lengthIsRequired'))
  });

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: InitialValuesType, input: string) => {
    if (input) {
      try {
        const length = parseInt(optionsValues.length, 10);
        setResult(
          truncateList(
            optionsValues.splitOperatorType,
            input,
            optionsValues.splitSeparator,
            optionsValues.joinSeparator,
            optionsValues.end,
            length
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
            description={inlineText('inline.separatorToJoinTheTruncatedList')}
          />
        </Box>
      )
    },
    {
      title: inlineText('inline.truncationOptions'),
      component: (
        <Box>
          <TextFieldWithDesc
            value={values.length}
            onOwnChange={(val) => updateField('length', val)}
            description={inlineText('inline.numberOfItemsToKeep')}
            type="number"
          />
          <SimpleRadio
            onClick={() => updateField('end', true)}
            checked={values.end}
            title={inlineText('inline.keepItemsFromTheBeginning')}
          />
          <SimpleRadio
            onClick={() => updateField('end', false)}
            checked={!values.end}
            title={inlineText('inline.keepItemsFromTheEnd')}
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
          title={inlineText('inline.truncatedList')}
          value={result}
        />
      }
      initialValues={initialValues}
      getGroups={getGroups}
      validationSchema={validationSchema}
      toolInfo={{
        title: inlineText('inline.listTruncation'),
        description: inlineText('inline.thisToolAllowsYouToTruncateA')
      }}
      exampleCards={exampleCards}
      input={input}
      setInput={setInput}
      compute={compute}
    />
  );
}
