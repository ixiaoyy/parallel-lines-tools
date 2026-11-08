import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { rotateList, SplitOperatorType } from './service';
import SimpleRadio from '@components/options/SimpleRadio';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { formatNumber } from '../../../../utils/number';
import ToolContent from '@components/ToolContent';
import { ToolComponentProps } from '@tools/defineTool';

const initialValues = {
  splitOperatorType: 'symbol' as SplitOperatorType,
  input: '',
  splitSeparator: ',',
  joinSeparator: ',',
  right: true,
  step: 1
};

export default function Rotate({ title }: ToolComponentProps) {
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
  const rotationDirections: {
    title: string;
    description: string;
    value: boolean;
  }[] = [
    {
      title: inlineText('inline.rotateForward'),
      description: inlineText('inline.rotateListItemsToTheRightDown'),
      value: true
    },
    {
      title: inlineText('inline.rotateBackward'),
      description: inlineText('inline.rotateListItemsToTheLeftUp'),
      value: false
    }
  ];

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const compute = (optionsValues: typeof initialValues, input: any) => {
    const { splitOperatorType, splitSeparator, joinSeparator, right, step } =
      optionsValues;

    setResult(
      rotateList(
        splitOperatorType,
        input,
        splitSeparator,
        joinSeparator,
        right,
        step
      )
    );
  };

  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={
        <ToolTextInput
          title={inlineText('chunk.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult
          title={inlineText('inline.rotatedList')}
          value={result}
        />
      }
      initialValues={initialValues}
      getGroups={({ values, updateField }) => [
        {
          title: inlineText('inline.itemSplitMode'),
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
                description={inlineText(
                  'findMostPopular.splitSeparatorDescription'
                )}
                value={values.splitSeparator}
                onOwnChange={(val) => updateField('splitSeparator', val)}
              />
            </Box>
          )
        },
        {
          title: inlineText('inline.rotationDirectionAndCount'),
          component: (
            <Box>
              {rotationDirections.map(({ title, description, value }) => (
                <SimpleRadio
                  key={`${value}`}
                  onClick={() => updateField('right', value)}
                  title={title}
                  description={description}
                  checked={values.right === value}
                />
              ))}
              <TextFieldWithDesc
                description={inlineText('inline.numberOfItemsToRotate')}
                value={values.step}
                onOwnChange={(val) => updateField('step', formatNumber(val, 1))}
              />
            </Box>
          )
        },
        {
          title: inlineText('inline.rotatedListJoiningSymbol'),
          component: (
            <Box>
              <TextFieldWithDesc
                value={values.joinSeparator}
                onOwnChange={(value) => updateField('joinSeparator', value)}
                description={inlineText(
                  'inline.enterTheCharacterThatGoesBetweenItems'
                )}
              />
            </Box>
          )
        }
      ]}
      compute={compute}
      setInput={setInput}
    />
  );
}
