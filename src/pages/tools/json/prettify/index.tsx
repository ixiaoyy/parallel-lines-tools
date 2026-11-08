import { useTranslation as useExampleTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import ToolCodeInput from '@components/input/ToolCodeInput';
import ToolCodeResult from '@components/result/ToolCodeResult';
import { beautifyJson } from './service';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import RadioWithTextField from '@components/options/RadioWithTextField';
import SimpleRadio from '@components/options/SimpleRadio';
import { updateNumberField } from '../../../../utils/string';
import ToolContent from '@components/ToolContent';
import { useTranslation } from 'react-i18next';
import { InitialValuesType } from './types';

const initialValues: InitialValuesType = {
  indentationType: 'space',
  spacesCount: 2
};

export default function PrettifyJson({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('json');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.beautifyAnUglyJsonArray'),
      description: exampleText('exampleUi.inThisExampleWePrettifyAnUglyJson'),
      sampleText: `[
 1,
2,3
]`,
      sampleResult: `[
    1,
    2,
    3
]`,
      sampleOptions: {
        indentationType: 'space',
        spacesCount: 4
      }
    },
    {
      title: exampleText('exampleUi.prettifyAComplexJsonObject'),
      description: exampleText('exampleUi.inThisExampleWePrettifyAComplexJson'),
      sampleText: `{"names":["jack","john","alex"],"hobbies":{"jack":["programming","rock climbing"],"john":["running","racing"],"alex":["dancing","fencing"]}}`,
      sampleResult: `{
  "names": [
    "jack",
    "john",
    "alex"
  ],
  "hobbies": {
    "jack": [
      "programming",
      "rock climbing"
    ],
    "john": [
      "running",
      "racing"
    ],
    "alex": [
      "dancing",
      "fencing"
    ]
  }
}`,
      sampleOptions: {
        indentationType: 'space',
        spacesCount: 2
      }
    },
    {
      title: exampleText('exampleUi.beautifyAJsonWithExcessiveWhitespace'),
      description: exampleText('exampleUi.inThisExampleWeShowHowTheJson'),
      sampleText: `
{
     "name":  "The Name of the Wind",
 "author"  : "Patrick Rothfuss",
     "genre"  :  "Fantasy",
     "published"   : 2007,
   "rating"    :  {
 "average"   :   4.6,
 "goodreads"         :   4.58,
      "amazon"   :  4.4
 },
      "is_fiction" : true
    }


`,
      sampleResult: `{
\t"name": "The Name of the Wind",
\t"author": "Patrick Rothfuss",
\t"genre": "Fantasy",
\t"published": 2007,
\t"rating": {
\t\t"average": 4.6,
\t\t"goodreads": 4.58,
\t\t"amazon": 4.4
\t},
\t"is_fiction": true
}`,
      sampleOptions: {
        indentationType: 'tab',
        spacesCount: 0
      }
    }
  ];

  const { t } = useTranslation('json');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: InitialValuesType, input: any) => {
    if (input) setResult(beautifyJson(input, optionsValues));
  };

  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={
        <ToolCodeInput
          title={t('prettify.inputTitle')}
          value={input}
          onChange={setInput}
          language="json"
        />
      }
      resultComponent={
        <ToolCodeResult
          title={t('prettify.resultTitle')}
          value={result}
          language="json"
        />
      }
      initialValues={initialValues}
      getGroups={({ values, updateField }) => [
        {
          title: t('prettify.indentation'),
          component: (
            <Box>
              <RadioWithTextField
                checked={values.indentationType === 'space'}
                title={t('prettify.useSpaces')}
                fieldName={'indentationType'}
                description={t('prettify.useSpacesDescription')}
                value={values.spacesCount.toString()}
                onRadioClick={() => updateField('indentationType', 'space')}
                onTextChange={(val) =>
                  updateNumberField(val, 'spacesCount', updateField)
                }
              />
              <SimpleRadio
                onClick={() => updateField('indentationType', 'tab')}
                checked={values.indentationType === 'tab'}
                description={t('prettify.useTabsDescription')}
                title={t('prettify.useTabs')}
              />
            </Box>
          )
        }
      ]}
      compute={compute}
      setInput={setInput}
      exampleCards={exampleCards}
      toolInfo={{
        title: t('prettify.toolInfo.title'),
        description: t('prettify.toolInfo.description')
      }}
    />
  );
}
