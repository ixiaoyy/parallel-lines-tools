import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useRef, useState } from 'react';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import SimpleRadio from '@components/options/SimpleRadio';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import ToolExamples, {
  CardExampleType
} from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { FormikProps } from 'formik';
import removeDuplicateLines, {
  DuplicateRemovalMode,
  DuplicateRemoverOptions,
  NewlineOption
} from './service';
import ToolContent from '@components/ToolContent';

// Initial values for our form
const initialValues: DuplicateRemoverOptions = {
  mode: 'all',
  newlines: 'filter',
  sortLines: false,
  trimTextLines: false
};

// Operation mode options

// Newlines options

// Example cards for demonstration

export default function RemoveDuplicateLines({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<typeof initialValues>[] = [
    {
      title: exampleText('exampleUi.removeDuplicateItemsFromList'),
      description: exampleText(
        'exampleUi.removesDuplicateItemsFromAShoppingListKeeping'
      ),
      sampleText: `Apples
Bananas
Milk
Eggs
Bread
Milk
Cheese
Apples
Yogurt`,
      sampleResult: `Apples
Bananas
Milk
Eggs
Bread
Cheese
Yogurt`,
      sampleOptions: {
        ...initialValues,
        mode: 'all',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: false
      }
    },
    {
      title: exampleText('exampleUi.cleanConsecutiveDuplicates'),
      description: exampleText(
        'exampleUi.removesConsecutiveDuplicatesFromLogEntriesWhichOften'
      ),
      sampleText: `[INFO] Application started
[ERROR] Connection failed
[ERROR] Connection failed
[ERROR] Connection failed
[INFO] Retrying connection
[ERROR] Authentication error
[ERROR] Authentication error
[INFO] Connection established`,
      sampleResult: `[INFO] Application started
[ERROR] Connection failed
[INFO] Retrying connection
[ERROR] Authentication error
[INFO] Connection established`,
      sampleOptions: {
        ...initialValues,
        mode: 'consecutive',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: false
      }
    },
    {
      title: exampleText('exampleUi.extractUniqueEntriesOnly'),
      description: exampleText('exampleUi.filtersAListToKeepOnlyEntriesThat'),
      sampleText: `Red
Blue
Green
Blue
Yellow
Purple
Red
Orange`,
      sampleResult: `Green
Yellow
Purple
Orange`,
      sampleOptions: {
        ...initialValues,
        mode: 'unique',
        newlines: 'filter',
        sortLines: false,
        trimTextLines: false
      }
    },
    {
      title: exampleText('exampleUi.sortAndCleanData'),
      description: exampleText(
        'exampleUi.removesDuplicateItemsFromAListTrimsWhitespace'
      ),
      sampleText: `  Apple
Banana
 Cherry
Apple
   Banana
Dragonfruit
 Elderberry `,
      sampleResult: `Apple
Banana
Cherry
Dragonfruit
Elderberry`,
      sampleOptions: {
        ...initialValues,
        mode: 'all',
        newlines: 'filter',
        sortLines: true,
        trimTextLines: true
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('string');
  const operationModes = [
    {
      title: inlineText('inline.removeAllDuplicateLines'),
      description: inlineText('inline.ifThisOptionIsSelectedThenAll'),
      value: 'all' as DuplicateRemovalMode
    },
    {
      title: inlineText('inline.removeConsecutiveDuplicateLines'),
      description: inlineText('inline.ifThisOptionIsSelectedThenOnly'),
      value: 'consecutive' as DuplicateRemovalMode
    },
    {
      title: inlineText('inline.leaveAbsolutelyUniqueTextLines'),
      description: inlineText('inline.ifThisOptionIsSelectedThenAll2'),
      value: 'unique' as DuplicateRemovalMode
    }
  ];
  const newlineOptions = [
    {
      title: inlineText('inline.preserveAllNewlines'),
      description: inlineText('inline.leaveAllEmptyLinesInTheOutput'),
      value: 'preserve' as NewlineOption
    },
    {
      title: inlineText('inline.filterAllNewlines'),
      description: inlineText('inline.processNewlinesAsRegularLines'),
      value: 'filter' as NewlineOption
    },
    {
      title: inlineText('inline.deleteAllNewlines'),
      description: inlineText('inline.beforeFilteringUniquesRemoveAllNewlines'),
      value: 'delete' as NewlineOption
    }
  ];

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const computeExternal = (
    optionsValues: typeof initialValues,
    inputText: string
  ) => {
    setResult(removeDuplicateLines(inputText, optionsValues));
  };

  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={<ToolTextInput value={input} onChange={setInput} />}
      resultComponent={
        <ToolTextResult
          title={inlineText('inline.textWithoutDuplicates')}
          value={result}
        />
      }
      initialValues={initialValues}
      getGroups={({ values, updateField }) => [
        {
          title: inlineText('inline.operationMode'),
          component: operationModes.map(({ title, description, value }) => (
            <SimpleRadio
              key={value}
              checked={value === values.mode}
              title={title}
              description={description}
              onClick={() => updateField('mode', value)}
            />
          ))
        },
        {
          title: inlineText('inline.newlinesTabsAndSpaces'),
          component: [
            ...newlineOptions.map(({ title, description, value }) => (
              <SimpleRadio
                key={value}
                checked={value === values.newlines}
                title={title}
                description={description}
                onClick={() => updateField('newlines', value)}
              />
            )),
            <CheckboxWithDesc
              key="trimTextLines"
              checked={values.trimTextLines}
              title={inlineText('inline.trimTextLines')}
              description={inlineText(
                'inline.beforeFilteringUniquesRemoveTabsAndSpaces'
              )}
              onChange={(checked) => updateField('trimTextLines', checked)}
            />
          ]
        },
        {
          title: inlineText('inline.sortLines'),
          component: [
            <CheckboxWithDesc
              key="sortLines"
              checked={values.sortLines}
              title={inlineText('inline.sortTheOutputLines')}
              description={inlineText(
                'inline.afterRemovingTheDuplicatesSortTheUnique'
              )}
              onChange={(checked) => updateField('sortLines', checked)}
            />
          ]
        }
      ]}
      compute={computeExternal}
      setInput={setInput}
      exampleCards={exampleCards}
    />
  );
}
