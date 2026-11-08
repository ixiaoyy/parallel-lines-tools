import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Box } from '@mui/material';
import ToolContent from '@components/ToolContent';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { duplicateList, SplitOperatorType } from './service';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { GetGroupsType } from '@components/options/ToolOptions';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import SimpleRadio from '@components/options/SimpleRadio';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';

interface InitialValuesType {
  splitOperatorType: SplitOperatorType;
  splitSeparator: string;
  joinSeparator: string;
  concatenate: boolean;
  reverse: boolean;
  copy: string;
}

const initialValues: InitialValuesType = {
  splitOperatorType: 'symbol',
  splitSeparator: ' ',
  joinSeparator: ' ',
  concatenate: true,
  reverse: false,
  copy: '2'
};

export default function Duplicate({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('list');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('duplicate.example1Title'),
      description: exampleText('duplicate.example1Description'),
      sampleText: 'Hello World',
      sampleResult: 'Hello World Hello World',
      sampleOptions: {
        splitOperatorType: 'symbol',
        splitSeparator: ' ',
        joinSeparator: ' ',
        concatenate: true,
        reverse: false,
        copy: '2'
      }
    },
    {
      title: exampleText('duplicate.example2Title'),
      description: exampleText('duplicate.example2Description'),
      sampleText: 'Hello World',
      sampleResult: 'Hello World World Hello',
      sampleOptions: {
        splitOperatorType: 'symbol',
        splitSeparator: ' ',
        joinSeparator: ' ',
        concatenate: true,
        reverse: true,
        copy: '2'
      }
    },
    {
      title: exampleText('duplicate.example3Title'),
      description: exampleText('duplicate.example3Description'),
      sampleText: 'Hello World',
      sampleResult: 'Hello Hello World World',
      sampleOptions: {
        splitOperatorType: 'symbol',
        splitSeparator: ' ',
        joinSeparator: ' ',
        concatenate: false,
        reverse: false,
        copy: '2'
      }
    },
    {
      title: exampleText('duplicate.example4Title'),
      description: exampleText('duplicate.example4Description'),
      sampleText: 'apple banana cherry',
      sampleResult: 'apple banana cherry apple banana',
      sampleOptions: {
        splitOperatorType: 'symbol',
        splitSeparator: ' ',
        joinSeparator: ' ',
        concatenate: true,
        reverse: false,
        copy: '1.7'
      }
    }
  ];

  // 校验提示仅做语言接线，规则和数据处理保持不变。
  const { t: inlineText } = useInlineTranslation('list');
  const validationSchema = Yup.object({
    splitSeparator: Yup.string().required(
      inlineText('inline.theSeparatorIsRequired')
    ),
    joinSeparator: Yup.string().required(
      inlineText('inline.theJoinSeparatorIsRequired')
    ),
    copy: Yup.number()
      .typeError(inlineText('inline.numberOfCopiesMustBeANumber'))
      .min(0.1, inlineText('inline.numberOfCopiesMustBePositive'))
      .required(inlineText('inline.numberOfCopiesIsRequired'))
  });

  const { t } = useTranslation('list');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: InitialValuesType, input: string) => {
    if (input) {
      try {
        const copy = parseFloat(optionsValues.copy);
        setResult(
          duplicateList(
            optionsValues.splitOperatorType,
            optionsValues.splitSeparator,
            optionsValues.joinSeparator,
            input,
            optionsValues.concatenate,
            optionsValues.reverse,
            copy
          )
        );
      } catch (error) {
        if (error instanceof Error) {
          setResult(`${t('duplicate.error')}: ${error.message}`);
        } else {
          setResult(t('duplicate.unknownError'));
        }
      }
    }
  };

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: t('duplicate.splitOptions'),
      component: (
        <Box>
          <SimpleRadio
            onClick={() => updateField('splitOperatorType', 'symbol')}
            checked={values.splitOperatorType === 'symbol'}
            title={t('duplicate.splitBySymbol')}
          />
          <SimpleRadio
            onClick={() => updateField('splitOperatorType', 'regex')}
            checked={values.splitOperatorType === 'regex'}
            title={t('duplicate.splitByRegex')}
          />
          <TextFieldWithDesc
            value={values.splitSeparator}
            onOwnChange={(val) => updateField('splitSeparator', val)}
            description={t('duplicate.splitSeparatorDescription')}
          />
          <TextFieldWithDesc
            value={values.joinSeparator}
            onOwnChange={(val) => updateField('joinSeparator', val)}
            description={t('duplicate.joinSeparatorDescription')}
          />
        </Box>
      )
    },
    {
      title: t('duplicate.duplicationOptions'),
      component: (
        <Box>
          <TextFieldWithDesc
            value={values.copy}
            onOwnChange={(val) => updateField('copy', val)}
            description={t('duplicate.copyDescription')}
            type="number"
          />
          <CheckboxWithDesc
            title={t('duplicate.concatenate')}
            checked={values.concatenate}
            onChange={(checked) => updateField('concatenate', checked)}
            description={t('duplicate.concatenateDescription')}
          />
          <CheckboxWithDesc
            title={t('duplicate.reverse')}
            checked={values.reverse}
            onChange={(checked) => updateField('reverse', checked)}
            description={t('duplicate.reverseDescription')}
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
          title={t('duplicate.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult title={t('duplicate.resultTitle')} value={result} />
      }
      initialValues={initialValues}
      getGroups={getGroups}
      validationSchema={validationSchema}
      toolInfo={{
        title: t('duplicate.toolInfo.title'),
        description: t('duplicate.toolInfo.description')
      }}
      exampleCards={exampleCards}
      input={input}
      setInput={setInput}
      compute={compute}
    />
  );
}
