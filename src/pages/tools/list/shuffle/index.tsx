import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import ToolContent from '@components/ToolContent';
import { shuffleList, SplitOperatorType } from './service';
import SimpleRadio from '@components/options/SimpleRadio';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { isNumber } from '@utils/string';
import { useTranslation } from 'react-i18next';

const initialValues = {
  splitOperatorType: 'symbol' as SplitOperatorType,
  splitSeparator: ',',
  joinSeparator: ',',
  length: ''
};

export default function Shuffle() {
  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('list');
  const splitOperators: {
    title: string;
    description: string;
    type: SplitOperatorType;
  }[] = [
    {
      title: inlineText('findMostPopular.splitOperators.symbol.title'),
      description: inlineText(
        'findMostPopular.splitOperators.symbol.description'
      ),
      type: 'symbol'
    },
    {
      title: inlineText('findMostPopular.splitOperators.regex.title'),
      type: 'regex',
      description: inlineText(
        'findMostPopular.splitOperators.regex.description'
      )
    }
  ];

  const { t } = useTranslation('list');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const compute = (optionsValues: typeof initialValues, input: any) => {
    const { splitOperatorType, splitSeparator, joinSeparator, length } =
      optionsValues;

    setResult(
      shuffleList(
        splitOperatorType,
        input,
        splitSeparator,
        joinSeparator,
        isNumber(length) ? Number(length) : undefined
      )
    );
  };

  return (
    <ToolContent
      title={t('shuffle.title')}
      initialValues={initialValues}
      compute={compute}
      input={input}
      setInput={setInput}
      inputComponent={
        <ToolTextInput
          title={t('shuffle.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult title={t('shuffle.resultTitle')} value={result} />
      }
      getGroups={({ values, updateField }) => [
        {
          title: t('shuffle.inputListSeparator'),
          component: (
            <Box>
              {splitOperators.map(({ title, description, type }) => (
                <SimpleRadio
                  key={type}
                  onClick={() => updateField('splitOperatorType', type)}
                  title={title}
                  description={description}
                  checked={values.splitOperatorType === type}
                />
              ))}
              <TextFieldWithDesc
                description={t('shuffle.delimiterDescription')}
                value={values.splitSeparator}
                onOwnChange={(val) => updateField('splitSeparator', val)}
              />
            </Box>
          )
        },
        {
          title: t('shuffle.shuffledListLength'),
          component: (
            <Box>
              <TextFieldWithDesc
                description={t('shuffle.outputLengthDescription')}
                value={values.length}
                onOwnChange={(val) => updateField('length', val)}
              />
            </Box>
          )
        },
        {
          title: t('shuffle.shuffledListSeparator'),
          component: (
            <Box>
              <TextFieldWithDesc
                value={values.joinSeparator}
                onOwnChange={(value) => updateField('joinSeparator', value)}
                description={t('shuffle.joinSeparatorDescription')}
              />
            </Box>
          )
        }
      ]}
    />
  );
}
