import { useTranslation as useExampleTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Box, Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { generatePassword } from './service';
import { initialValues, InitialValuesType } from './initialValues';
import ToolContent from '@components/ToolContent';
import ToolTextResult from '@components/result/ToolTextResult';
import TextFieldWithDesc from '@components/options/TextFieldWithDesc';
import { ToolComponentProps } from '@tools/defineTool';
import { GetGroupsType } from '@components/options/ToolOptions';
import { CardExampleType } from '@components/examples/ToolExamples';
import { useTranslation } from 'react-i18next';

export default function PasswordGenerator({ title }: ToolComponentProps) {
  // 示例标题和说明随界面语言更新；sampleText、sampleResult 和选项原样保留。
  const { t: exampleText } = useExampleTranslation('string');
  const exampleCards: CardExampleType<InitialValuesType>[] = [
    {
      title: exampleText('exampleUi.strongPassword12Characters'),
      description: exampleText(
        'exampleUi.generateASecurePasswordWithAllCharacterTypes'
      ),
      sampleText: '',
      sampleResult: 'A7#mK9$pL2@x',
      sampleOptions: {
        length: '12',
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: true,
        avoidAmbiguous: false
      }
    },
    {
      title: exampleText('exampleUi.simplePassword8Characters'),
      description: exampleText(
        'exampleUi.generateABasicPasswordWithLettersAndNumbers'
      ),
      sampleText: '',
      sampleResult: 'Ab3mK9pL',
      sampleOptions: {
        length: '8',
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: false,
        avoidAmbiguous: false
      }
    },
    {
      title: exampleText('exampleUi.clearPasswordNoAmbiguous'),
      description: exampleText(
        'exampleUi.generateAPasswordWithoutAmbiguousCharactersII'
      ),
      sampleText: '',
      sampleResult: 'A7#mK9$pL2@x',
      sampleOptions: {
        length: '12',
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: true,
        avoidAmbiguous: true
      }
    }
  ];

  const { t } = useTranslation('string');
  const [result, setResult] = useState<string>('');

  function compute(values: InitialValuesType) {
    setResult(generatePassword(values));
  }

  const getGroups: GetGroupsType<InitialValuesType> = ({
    values,
    updateField
  }) => [
    {
      title: t('passwordGenerator.optionsTitle'),
      component: (
        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
          <TextFieldWithDesc
            description={t('passwordGenerator.lengthDesc')}
            placeholder={t('passwordGenerator.lengthPlaceholder')}
            value={values.length}
            onOwnChange={(val) => {
              const length = Number(val);

              if (length > 256) {
                updateField('length', '256');
                return;
              }

              if (length < 4 && val !== '') {
                updateField('length', '4');
                return;
              }

              updateField('length', val);
            }}
            type="number"
            inputProps={{
              min: 4,
              max: 256
            }}
          />

          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.includeLowercase}
                  onChange={(e) =>
                    updateField('includeLowercase', e.target.checked)
                  }
                />
              }
              label={t('passwordGenerator.includeLowercase')}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.includeUppercase}
                  onChange={(e) =>
                    updateField('includeUppercase', e.target.checked)
                  }
                />
              }
              label={t('passwordGenerator.includeUppercase')}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.includeNumbers}
                  onChange={(e) =>
                    updateField('includeNumbers', e.target.checked)
                  }
                />
              }
              label={t('passwordGenerator.includeNumbers')}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.includeSymbols}
                  onChange={(e) =>
                    updateField('includeSymbols', e.target.checked)
                  }
                />
              }
              label={t('passwordGenerator.includeSymbols')}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.avoidAmbiguous}
                  onChange={(e) =>
                    updateField('avoidAmbiguous', e.target.checked)
                  }
                />
              }
              label={t('passwordGenerator.avoidAmbiguous')}
            />
          </FormGroup>
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
      resultComponent={
        <ToolTextResult
          title={t('passwordGenerator.resultTitle')}
          value={result}
        />
      }
      toolInfo={{
        title: t('passwordGenerator.toolInfo.title'),
        description: t('passwordGenerator.toolInfo.description')
      }}
      exampleCards={exampleCards}
    />
  );
}
