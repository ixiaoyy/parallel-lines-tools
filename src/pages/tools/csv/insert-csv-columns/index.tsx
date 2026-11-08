import { useTranslation as useExampleTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import React, { useState } from 'react';
import ToolContent from '@components/ToolContent';
import ToolTextInput from '@components/input/ToolTextInput';
import ToolTextResult from '@components/result/ToolTextResult';
import { main } from './service';
import { InitialValuesType } from './types';
import { GetGroupsType } from '@components/options/ToolOptions';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import SelectWithDesc from '@components/options/SelectWithDesc';
import { CardExampleType } from '@components/examples/ToolExamples';
import { ToolComponentProps } from '@tools/defineTool';
import { getCsvHeaders } from '@utils/csv';
import { useTranslation } from 'react-i18next';

const initialValues: InitialValuesType = {
  csvToInsert: '',
  commentCharacter: '#',
  separator: ',',
  quoteChar: '"',
  insertingPosition: 'append',
  customFill: false,
  customFillValue: '',
  customPostionOptions: 'headerName',
  headerName: '',
  rowNumber: 1
};

export default function InsertCsvColumns({
  title,
  longDescription
}: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('csv');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.insertASingleColumnByPosition'),
      description: exampleText('exampleUi.inThisExampleWeInsertASingleColumn'),
      sampleText: `Brand,Model
Toyota,Camry
Ford,Mustang
Honda,Accord
Chevrolet,Malibu`,
      sampleResult: `city,Brand,Model
dallas,Toyota,Camry
houston,Ford,Mustang
dallas,Honda,Accord
houston,Chevrolet,Malibu`,
      sampleOptions: {
        csvToInsert: `city
dallas
houston`,
        commentCharacter: '#',
        separator: ',',
        quoteChar: '"',
        insertingPosition: 'custom',
        customFill: true,
        customFillValue: 'k',
        customPostionOptions: 'rowNumber',
        headerName: '',
        rowNumber: 1
      }
    },
    {
      title: exampleText('exampleUi.appendMultipleColumnsByHeaderName'),
      description: exampleText('exampleUi.inThisExampleWeAppendTwoDataColumns'),
      sampleText: `Brand,Model
Toyota,Camry
Ford,Mustang
Honda,Accord
Chevrolet,Malibu`,
      sampleResult: `Brand,Model,Year,Price
Toyota,Camry,2022,25000
Ford,Mustang,2021,35000
Honda,Accord,2022,27000
Chevrolet,Malibu,2021,28000`,
      sampleOptions: {
        csvToInsert: `Year,Price
2022,25000
2021,35000
2022,27000
2021,28000`,
        commentCharacter: '#',
        separator: ',',
        quoteChar: '"',
        insertingPosition: 'custom',
        customFill: false,
        customFillValue: 'x',
        customPostionOptions: 'headerName',
        headerName: 'Model',
        rowNumber: 1
      }
    },
    {
      title: exampleText('exampleUi.appendMultipleColumns'),
      description: exampleText(
        'exampleUi.inThisExampleWeAppendTwoDataColumns2'
      ),
      sampleText: `Brand,Model
Toyota,Camry
Ford,Mustang
Honda,Accord
Chevrolet,Malibu`,
      sampleResult: `Brand,Model,Year,Price
Toyota,Camry,2022,25000
Ford,Mustang,2021,35000
Honda,Accord,2022,27000
Chevrolet,Malibu,2021,28000`,
      sampleOptions: {
        csvToInsert: `Year,Price
2022,25000
2021,35000
2022,27000
2021,28000`,
        commentCharacter: '#',
        separator: ',',
        quoteChar: '"',
        insertingPosition: 'append',
        customFill: false,
        customFillValue: 'x',
        customPostionOptions: 'rowNumber',
        headerName: '',
        rowNumber: 1
      }
    }
  ];

  const { t } = useTranslation('csv');
  const [input, setInput] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const compute = (values: InitialValuesType, input: string) => {
    setResult(main(input, values));
  };

  const headers = getCsvHeaders(input);
  const headerOptions =
    headers.length > 0
      ? headers.map((item) => ({
          label: `${item}`,
          value: item
        }))
      : [];

  const getGroups: GetGroupsType<InitialValuesType> | null = ({
    values,
    updateField
  }) => [
    {
      title: t('insertCsvColumns.csvToInsert'),
      component: (
        <Box>
          <TextFieldWithDesc
            multiline
            rows={3}
            value={values.csvToInsert}
            onOwnChange={(val) => updateField('csvToInsert', val)}
            title={t('insertCsvColumns.csvSeparator')}
            description={t('insertCsvColumns.csvToInsertDescription')}
          />
        </Box>
      )
    },
    {
      title: t('insertCsvColumns.csvOptions'),
      component: (
        <Box>
          <TextFieldWithDesc
            value={values.separator}
            onOwnChange={(val) => updateField('separator', val)}
            description={t('insertCsvColumns.separatorDescription')}
          />
          <TextFieldWithDesc
            value={values.quoteChar}
            onOwnChange={(val) => updateField('quoteChar', val)}
            description={t('insertCsvColumns.quoteCharDescription')}
          />
          <TextFieldWithDesc
            value={values.commentCharacter}
            onOwnChange={(val) => updateField('commentCharacter', val)}
            description={t('insertCsvColumns.commentCharacterDescription')}
          />
          <SelectWithDesc
            selected={values.customFill}
            options={[
              {
                label: t('insertCsvColumns.fillWithEmptyValues'),
                value: false
              },
              {
                label: t('insertCsvColumns.fillWithCustomValues'),
                value: true
              }
            ]}
            onChange={(value) => {
              updateField('customFill', value);
              if (!value) {
                updateField('customFillValue', ''); // Reset custom fill value
              }
            }}
            description={t('insertCsvColumns.customFillDescription')}
          />
          {values.customFill && (
            <TextFieldWithDesc
              value={values.customFillValue}
              onOwnChange={(val) => updateField('customFillValue', val)}
              description={t('insertCsvColumns.customFillValueDescription')}
            />
          )}
        </Box>
      )
    },
    {
      title: t('insertCsvColumns.positionOptions'),
      component: (
        <Box>
          <SelectWithDesc
            selected={values.insertingPosition}
            options={[
              {
                label: t('insertCsvColumns.prependColumns'),
                value: 'prepend'
              },
              {
                label: t('insertCsvColumns.appendColumns'),
                value: 'append'
              },
              {
                label: t('insertCsvColumns.customPosition'),
                value: 'custom'
              }
            ]}
            onChange={(value) => updateField('insertingPosition', value)}
            description={t('insertCsvColumns.insertingPositionDescription')}
          />

          {values.insertingPosition === 'custom' && (
            <SelectWithDesc
              selected={values.customPostionOptions}
              options={[
                {
                  label: t('insertCsvColumns.headerName'),
                  value: 'headerName'
                },
                {
                  label: t('insertCsvColumns.position'),
                  value: 'rowNumber'
                }
              ]}
              onChange={(value) => updateField('customPostionOptions', value)}
              description={t(
                'insertCsvColumns.customPositionOptionsDescription'
              )}
            />
          )}

          {values.insertingPosition === 'custom' &&
            values.customPostionOptions === 'headerName' && (
              <SelectWithDesc
                selected={values.headerName}
                options={headerOptions}
                onChange={(value) => updateField('headerName', value)}
                description={t('insertCsvColumns.headerNameDescription')}
              />
            )}

          {values.insertingPosition === 'custom' &&
            values.customPostionOptions === 'rowNumber' && (
              <TextFieldWithDesc
                value={values.rowNumber.toString()}
                onOwnChange={(val) =>
                  updateField('rowNumber', parseInt(val) || 0)
                }
                description={t('insertCsvColumns.rowNumberDescription')}
                type="number"
              />
            )}
        </Box>
      )
    }
  ];

  return (
    <ToolContent
      title={title}
      inputComponent={
        <ToolTextInput
          title={t('insertCsvColumns.inputTitle')}
          value={input}
          onChange={setInput}
        />
      }
      resultComponent={
        <ToolTextResult
          title={t('insertCsvColumns.resultTitle')}
          value={result}
          extension={'csv'}
        />
      }
      initialValues={initialValues}
      getGroups={getGroups}
      compute={compute}
      input={input}
      setInput={setInput}
      toolInfo={{
        title: t('insertCsvColumns.toolInfo.title'),
        description: t('insertCsvColumns.toolInfo.description')
      }}
      exampleCards={exampleCards}
    />
  );
}
