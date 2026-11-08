import { useTranslation as useExampleTranslation } from 'react-i18next';
import { useTranslation as useInlineTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Box } from '@mui/material';
import ToolContent from '@components/ToolContent';
import { GetGroupsType } from '@components/options/ToolOptions';
import { ToolComponentProps } from '@tools/defineTool';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { CardExampleType } from '@components/examples/ToolExamples';
import SelectWithDesc from '@components/options/SelectWithDesc';
import CheckboxWithDesc from '@components/options/CheckboxWithDesc';
import SimpleRadio from '@components/options/SimpleRadio';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { csvColumnsSwap } from './service';
import { getCsvHeaders } from '@utils/csv';
import { InitialValuesType } from './types';

const initialValues: InitialValuesType = {
  fromPositionStatus: true,
  toPositionStatus: true,
  fromPosition: '1',
  toPosition: '2',
  fromHeader: '',
  toHeader: '',
  emptyValuesFilling: true,
  customFiller: '',
  deleteComment: true,
  commentCharacter: '#',
  emptyLines: true
};

export default function CsvToTsv({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('csv');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.moveTheKeyColumnToTheFirstPosition'),
      description: exampleText('exampleUi.inThisExampleWeUseOurCsvColumn'),
      sampleText: `park_name,location
Yellowstone,Wyoming
Yosemite,California
Grand Canyon,Arizona
Rocky Mountain,Colorado
Zion Park,Utah`,
      sampleResult: `location,park_name
Wyoming,Yellowstone
California,Yosemite
Arizona,Grand Canyon
Colorado,Rocky Mountain
Utah,Zion Park`,
      sampleOptions: {
        fromPositionStatus: true,
        toPositionStatus: true,
        fromPosition: '1',
        toPosition: '2',
        fromHeader: 'park_name',
        toHeader: 'location',
        emptyValuesFilling: false,
        customFiller: '*',
        deleteComment: false,
        commentCharacter: '',
        emptyLines: false
      }
    },
    {
      title: exampleText('exampleUi.reorganizeColumnsInVitaminsCsv'),
      description: exampleText('exampleUi.inThisExampleALabInternMadeA'),
      sampleText: `Function,Fat-Soluble,Vitamin,Sources
Supports vision,Fat-Soluble,A,Carrots
Immune function,Water-Soluble,C,Citrus fruits
Bone health,Fat-Soluble,D,Fatty fish
Antioxidant,Fat-Soluble,E,Nuts
Blood clotting,Fat-Soluble,K,Leafy greens
Energy production,Water-Soluble,B1
Energy production,Water-Soluble,B2
Energy production,Water-Soluble,B3,Meat
Protein metabolism,Water-Soluble,B6,Poultry
Nervous system,Water-Soluble,B12,Meat`,
      sampleResult: `Vitamin,Fat-Soluble,Function,Sources
A,Fat-Soluble,Supports vision,Carrots
C,Water-Soluble,Immune function,Citrus fruits
D,Fat-Soluble,Bone health,Fatty fish
E,Fat-Soluble,Antioxidant,Nuts
K,Fat-Soluble,Blood clotting,Leafy greens
B1,Water-Soluble,Energy production,*
B2,Water-Soluble,Energy production,*
B3,Water-Soluble,Energy production,Meat
B6,Water-Soluble,Protein metabolism,Poultry
B12,Water-Soluble,Nervous system,Meat`,
      sampleOptions: {
        fromPositionStatus: false,
        toPositionStatus: false,
        fromPosition: '1',
        toPosition: '2',
        fromHeader: 'Vitamin',
        toHeader: 'Function',
        emptyValuesFilling: false,
        customFiller: '*',
        deleteComment: false,
        commentCharacter: '',
        emptyLines: false
      }
    },
    {
      title: exampleText('exampleUi.placeColumnsSideBySideForAnalysis'),
      description: exampleText('exampleUi.inThisExampleWeChangeTheOrderOf'),
      sampleText: `Brand,Model,ScreenSize,OS,Price

Apple,iPhone 15 Pro Max,6.7″,iOS,$1299
Samsung,Galaxy S23 Ultra,6.8″,Android,$1199
Google,Pixel 7 Pro,6.4″,Android,$899

#OnePlus,11 Pro,6.7″,Android,$949
Xiaomi,13 Ultra,6.6″,Android,$849`,
      sampleResult: `Brand,Model,OS,ScreenSize,Price
Apple,iPhone 15 Pro Max,iOS,6.7″,$1299
Samsung,Galaxy S23 Ultra,Android,6.8″,$1199
Google,Pixel 7 Pro,Android,6.4″,$899
Xiaomi,13 Ultra,Android,6.6″,$849`,
      sampleOptions: {
        fromPositionStatus: false,
        toPositionStatus: true,
        fromPosition: '1',
        toPosition: '4',
        fromHeader: 'ScreenSize',
        toHeader: 'OS',
        emptyValuesFilling: true,
        customFiller: 'x',
        deleteComment: true,
        commentCharacter: '#',
        emptyLines: true
      }
    }
  ];

  // 本工具的展示文案随语言切换更新；示例原始数据与计算参数保持不变。
  const { t: inlineText } = useInlineTranslation('csv');

  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (optionsValues: InitialValuesType, input: string) => {
    setResult(csvColumnsSwap(input, optionsValues));
  };

  const headers = getCsvHeaders(input);
  const headerOptions = headers.map((item) => ({
    label: `${item}`,
    value: item
  }));

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: inlineText('inline.swapFromColumn'),
      component: (
        <Box>
          <SimpleRadio
            onClick={() => updateField('fromPositionStatus', true)}
            title={inlineText('inline.setColumnFromPosition')}
            checked={values.fromPositionStatus}
          />
          {values.fromPositionStatus && (
            <TextFieldWithDesc
              description={inlineText('inline.positionOfTheFirstColumnYouWant')}
              value={values.fromPosition}
              onOwnChange={(val) => updateField('fromPosition', val)}
              type="number"
              inputProps={{ min: 1, max: headers.length }}
            />
          )}

          <SimpleRadio
            onClick={() => updateField('fromPositionStatus', false)}
            title={inlineText('inline.setColumnFromHeader')}
            checked={!values.fromPositionStatus}
          />
          {!values.fromPositionStatus && (
            <SelectWithDesc
              selected={values.fromHeader}
              options={headerOptions}
              onChange={(value) => updateField('fromHeader', value)}
              description={inlineText('inline.headerOfTheFirstColumnYouWant')}
            />
          )}
        </Box>
      )
    },
    {
      title: inlineText('inline.swapToColumn'),
      component: (
        <Box>
          <SimpleRadio
            onClick={() => updateField('toPositionStatus', true)}
            title={inlineText('inline.setColumnToPosition')}
            checked={values.toPositionStatus}
          />
          {values.toPositionStatus && (
            <TextFieldWithDesc
              description={inlineText(
                'inline.positionOfTheSecondColumnYouWant'
              )}
              value={values.toPosition}
              onOwnChange={(val) => updateField('toPosition', val)}
              type="number"
              inputProps={{ min: 1, max: headers.length }}
            />
          )}
          <SimpleRadio
            onClick={() => updateField('toPositionStatus', false)}
            title={inlineText('inline.setColumnToHeader')}
            checked={!values.toPositionStatus}
          />
          {!values.toPositionStatus && (
            <SelectWithDesc
              selected={values.toHeader}
              options={headerOptions}
              onChange={(value) => updateField('toHeader', value)}
              description={inlineText('inline.headerOfTheSecondColumnYouWant')}
            />
          )}
        </Box>
      )
    },
    {
      title: inlineText('inline.incompleteData'),
      component: (
        <Box>
          <SelectWithDesc
            selected={values.emptyValuesFilling}
            options={[
              {
                label: inlineText('insertCsvColumns.fillWithEmptyValues'),
                value: true
              },
              { label: inlineText('inline.fillWithCustomValues'), value: false }
            ]}
            onChange={(value) => updateField('emptyValuesFilling', value)}
            description={inlineText(
              'inline.fillIncompleteCsvDataWithEmptySymbols'
            )}
          />
          {!values.emptyValuesFilling && (
            <TextFieldWithDesc
              description={inlineText(
                'inline.specifyACustomSymbolToFillIncomplete'
              )}
              value={values.customFiller}
              onOwnChange={(val) => updateField('customFiller', val)}
            />
          )}
        </Box>
      )
    },
    {
      title: inlineText('inline.commentsAndEmptyLines'),
      component: (
        <Box>
          <CheckboxWithDesc
            checked={values.deleteComment}
            onChange={(value) => updateField('deleteComment', value)}
            title={inlineText('inline.deleteComments')}
            description={inlineText(
              'inline.ifCheckedCommentsGivenByTheFollowing'
            )}
          />
          {values.deleteComment && (
            <TextFieldWithDesc
              description={inlineText(
                'inline.specifyTheCharacterUsedToStartComments'
              )}
              value={values.commentCharacter}
              onOwnChange={(val) => updateField('commentCharacter', val)}
            />
          )}

          <CheckboxWithDesc
            checked={values.emptyLines}
            onChange={(value) => updateField('emptyLines', value)}
            title={inlineText('inline.deleteEmptyLines')}
            description={inlineText('inline.doNotIncludeEmptyLinesInThe')}
          />
        </Box>
      )
    }
  ];

  return (
    <ToolContent
      title={title}
      input={input}
      inputComponent={<ToolTextInput value={input} onChange={setInput} />}
      resultComponent={<ToolTextResult value={result} />}
      initialValues={initialValues}
      getGroups={getGroups}
      setInput={setInput}
      compute={compute}
      toolInfo={{ title: `What is a ${title}?`, description: longDescription }}
      exampleCards={exampleCards}
    />
  );
}
